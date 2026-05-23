---
title: 'I broke into my own Roomba over the LAN'
description: 'On my own Roomba i2, under the constraints of no physical operation, no cloud API, and LAN-only, I tested how much I could exfiltrate and attack. MQTT auth was solid but cutting off cloud traffic was easy, and in the end I extracted the MQTT password with the dorita980 magic packet.'
pubDate: 'May 23 2026'
tags: ['security', 'iot', 'mqtt', 'home-assistant', 'reverse-engineering']
---

> ⚠️ This experiment was run **on my own device, inside my own LAN**. Doing the same to someone else's device or network is illegal.

## Introduction

I tested how much I could exfiltrate from, and how much I could control, an iRobot Roomba i2 sitting on my home LAN (my own unit, the one that runs the household). Reconnaissance got me close to full visibility, but the MQTT auth wall was thick and I couldn't achieve full control over the network alone. In the end I reached the point of extracting the MQTT password with the magic packet the dorita980 community reverse-engineered (button-press included).

There's a standard procedure for extracting the MQTT password to drive a Roomba through Home Assistant (the official HA integration uses it too). But just "using it silently" doesn't tell you what's happening underneath, or which layer of auth gives way. I wanted to measure on real hardware what's visible from the LAN side alone, not via the cloud.

Target info:

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Model          | iRobot Roomba i2 (sku: i215860)       |
| Firmware       | daredevil+2.6.0+daredevil-release+163 |
| IP             | 192.168.1.20                          |
| MAC            | OUI: iRobot                           |
| Cloud endpoint | AWS IoT (443/tcp)                     |

## Phase 1: Reconnaissance

- **nmap network scan** → found 16 devices, identified the iRobot from the MAC OUI
- **UDP 5678 discovery protocol** → `echo -n "irobotmcs" | nc -u -w3 192.168.1.20 5678` exposes the device name, BLID, firmware, and capability list as JSON, in the clear. **No auth required.**
- **Port scan (all 65535)** → the only open port is 8883/tcp (MQTT over TLS)
- **TLS certificate inspection** → pulled iRobot's self-signed chain. Bonus finding: the intermediate CA "Robot Intermediate CA A01" had already expired at the end of 2025.

## Phase 2: Attacking MQTT auth

- **Default password attempts** → tried blid/empty, blid/blid, etc. with paho-mqtt. All rc=134 (Not Authorized).
- **Found a rate limit** → Connection refused after 2-3 failed auths. Brute-force protection is in place.
- **dorita980 magic packet attempt** → sent `0xf005efcc3b2900`. The response ended in `0x03` (provisioning mode not active). The protocol itself works, but a button press is required.

## Phase 3: MITM (man-in-the-middle)

- **ARP spoof** → spoofed the gateway to the Roomba with scapy. Confirmed with tshark that all of the Roomba's traffic now routes through me.
- **Result** → the Roomba talks TLS to the cloud (443/tcp). Every frame became a retransmission, so I **effectively cut off cloud communication.**
- **iptables DNAT** → redirected the Roomba's 443/8883-bound traffic to a fake MQTT server.
- **Fake MQTT server** → stood up a TLS server with a self-signed cert, designed to harvest the credentials from the MQTT CONNECT.
- **Result: TLS handshake failed** → the Roomba validates the server certificate and rejected the fake one. The connection never even arrived.

## Phase 4: TCP RST injection

With scapy I sent TCP RSTs impersonating the cloud server, across multiple sequence numbers, to drop the Roomba's existing connection and induce a reconnect. But I couldn't catch the reconnect timing — a swing and a miss.

## Phase 5: dorita980 magic packet (button-press included)

This is the final exfiltration path. The magic packet the dorita980 community reverse-engineered extracts the MQTT password. Home Assistant's roomba integration is based on this too.

```python
import ssl, socket

ROOMBA_IP = "192.168.1.20"
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

sock = socket.create_connection((ROOMBA_IP, 8883), timeout=10)
tls = ctx.wrap_socket(sock)

# the magic packet dorita980 discovered
magic = bytes([0xf0, 0x05, 0xef, 0xcc, 0x3b, 0x29, 0x00])
tls.send(magic)

resp = tls.recv(1024)
# the password is from byte 8 onward (null-terminated)
password = resp[7:].split(b'\x00')[0].decode()
print(f"Password: {password}")
tls.close()
```

How it works:

1. Hold the Roomba's HOME / CLEAN button for 2 seconds (until it beeps)
2. Run the script above within 2 minutes
3. `0xf0` is an MQTT reserved packet type; iRobot repurposed it for its own provisioning protocol
4. Sending the magic packet during provisioning mode (the 2-minute window) returns a response containing the MQTT password

What you can do once you have the password: start / stop cleaning, send it home to the dock, change schedules, pull map data, get real-time sensor info, change settings, and so on — all LAN-side, no cloud needed.

## Gotchas

- **From the J7 series onward, local extraction is closed off and it's cloud-API-only.** A generation like the i2 still works.
- **A firmware update may close the magic-packet path.**
- **An unattempted but promising attack vector**: cut off cloud + NTP to slowly drift the internal clock, throw off the TLS certificate-expiry check, and get the device to accept a fake server. In theory it reaches MQTT password extraction, but it takes time.
- **`ssl.CERT_NONE`, which silently accepts the Roomba's self-signed cert**, is for testing only. Properly you'd verify against a trusted certificate chain.

## Results (security assessment)

| Item                         | Assessment                                    |
| ---------------------------- | --------------------------------------------- |
| Information leak (UDP 5678)  | Weak (device info exposed with no auth)       |
| MQTT auth                    | Solid (rate limit, unique password)           |
| TLS certificate validation   | Solid (validates server cert, rejects MITM)   |
| Cloud traffic protection     | Weak (easily cut off with ARP spoof)          |
| OTA update protection        | Can be disabled by cutting off the cloud      |
| Time-dependent crypto checks | Untested (possibly attackable by cutting NTP) |

Tools used: nmap / tshark / scapy / paho-mqtt / openssl / netcat / iptables.

## Wrap-up

- From the LAN side alone, reconnaissance gets close to full visibility.
- The MQTT auth itself is solid, and TLS certificate validation works properly.
- Cloud communication is surprisingly easy to cut off with an ARP spoof.
- Full control needs the dorita980 magic packet (button-press included) — the very mechanism running underneath the official HA integration.

## References

- [dorita980 (GitHub)](https://github.com/koalazak/dorita980)
- [Home Assistant Roomba integration](https://www.home-assistant.io/integrations/roomba/)
- [iRobot Authentication Reverse Engineering (dorita980 wiki)](https://github.com/koalazak/dorita980/wiki)
