---
title: ADSL
sidebar:
  order: 23
slug: s3/data-communication-and-networking/adsl
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.693Z
lastUpdatedOn: 2026-04-22T07:15:36.793Z
---

Short for Asymmetric Digital Subscriber Line. Makes use of existing voice telephone network to create a digital subscriber line link between the network and subscriber. Uses traditional copper telephone lines. Uses FDM.

Traditional copper telephone lines can support upto $1\,\text{MHz}$ bandwidth. But the voice communication was designed to use frequency upto $4\,\text{kHz}$. The unused bandwidth is exploited by ADSL for data communication.
- $0 - 25\, \text{kHz}$ is reserved for voice communication (Plain Old Telephone Service or POTS)
- Remaining bandwidth is reserved for data communication

A short upstream and a long downstream bands are allocated using either FDM or echo cancellation.

The word _asymmetric_ refers that the downstream capacity is higher than the upstream capacity.

### Echo Cancellation

A signal processing technique that allows transmission of digital signals in both directions on a single link simultaneously. Works by canceling out the echo signal that is reflected back from the subscriber's end to the network's end.

### Dynamic Multitone

Aka. DMT. A modulation technique used in ADSL. Used to efficiently transmit data over copper telephone lines.

DMT divides the available frequency spectrum into multiple subchannels, or _tones_ of $4\,\text{kHz}$. Each subchannel can carry data rate upto $60\,\text{kbps}$. Each tone can carry a certain number of bits depending on the quality of the channel at that frequency.

The transmitter and receiver continuously monitor the signal-to-noise ratio (SNR) of each tone and dynamically allocate more bits to tones with higher SNR. Maximizes data throughput and reliability, allowing ADSL to achieve higher speeds even in the presence of noise and interference.
