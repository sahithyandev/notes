---
title: System Architecture
sidebar:
  order: 3
slug: s4/iot/system-architecture
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.624Z
lastUpdatedOn: 2026-04-23T17:39:39.624Z
---

An IoT solution consists of interconnected hardware and software components that collect data, transmit it, and process it for decision making.

## Major Components

### Device Layer

Aka. edge layer. Hardware components embedded in physical devices. Includes:

- Sensors  
  Take inputs from the environment and convert them into data.
- Actuators  
  Modify the environment based on commands from the system.
- Hardware interfaces
- Microcontrollers
- Embedded software

### Communication Layer

Aka. fog layer. Responsible for transmitting data between devices and servers.

Examples:

- Wireless communication protocols
- Internet connectivity
- Networking infrastructure

### Processing and Cloud Layer

Processes and analyzes IoT data.

Technologies:

- Cloud servers
- Big data analytics
- Artificial Intelligence / Machine Learning
- Data analytics platforms (e.g., Google Cloud, AWS, Azure)

#### Edge Processing

Where data is processed at the IoT devices (hence _edge_) of the network, close to the source of data generation. Computing power is very limited. Reduces latency and bandwidth usage by processing data locally instead of sending it to the cloud.

#### Fog Processing

Where data is processed at intermediate nodes between the edge and the cloud. These nodes can be local servers, gateways, or routers that provide additional computing resources. Slightly more computing power than edge devices. Reduces latency and bandwidth usage compared to sending everything to the cloud.
