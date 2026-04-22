---
title: Services
sidebar:
  order: 4
slug: s3/operating-systems/services
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.705Z
lastUpdatedOn: 2026-04-22T07:15:36.799Z
---

## User Interface

A user goal. Allows interaction with the OS.

### Command-Line Interface

Aka. CLI. Takes text commands. Shell executes commands (built-in or external).

### Graphical User Interface

Aka. GUI. Uses icons, windows, menus.

### Touch Interface

A subtype of GUI. Gesture-based interaction. Also includes voice based interfaces.

## Program Execution

Transforms code into an executable and loads it for execution.

### Compiler

Translates high-level code (of a compiled language) to object file(s).

### Object File

A binary file that contains partially-compied machine-code, data, and metadata. Produced by compiler. Not executable.

### Relocatable Object File

An object file that can be loaded at any memory address.

### Linker

Combines object files and libraries to produce executable.

### Static Linking

System libraries and program code combined by the loader into the executable.

### Dynamic Linking

Linking of libraries done at runtime using a _stub_. Library code not included within the executable. Enables shared libraries and easier updates. Technically, a program can implement its own dynamic linking process, but would not be easy. OS support would be required in practical scenarios.

- Windows - `.dll` files
- Linux - `.so` files

### Loader

Places executable into memory, relocates addresses, starts execution.

### Dynamic Loading

Routines loaded only when called. Saves memory. Code shipped with the executable. Implemented using program design. OS support is not required (can be complementary though).

## Communication

Between processes and simultaneously logged in users.

### Message Passing

Data exchanged via OS-managed messages.

### Shared Memory

Multiple processes are allowed to share a memory region.

## File-System Management

OS gives a logical view of storage using files. Directories group files.

OS provides syscalls to:

- Create, delete files and directories
- Allow file access and manipulation
- Manage storage mapping
- Maintain backups

## Debugging

### Logs

A recorded message written by the OS or an application describing events, warnings, and errors. Logs help understand what happened before a fault. Examples: Linux `/var/log/*`, Windows Event Viewer.

### Core Dump

A snapshot of a process’s memory taken at the moment it crashes. It includes the stack, heap, registers, and program counter. This allows a debugger to reconstruct the exact state of the process during failure.

### Crash Dump

Similar to core dump. Applies to the entire kernel or OS. It records kernel memory and machine state after a fatal system error (e.g., kernel panic, BSOD). Useful for diagnosing driver bugs and kernel faults.

## Performance Tuning

Refers to the process of analyzing the system to identify and remove bottlenecks (slow points), such as CPU overuse, memory pressure, I/O saturation, or slow network paths.

### Bottleneck

The component that limits overall system performance. Fixing it often improves total speed more than modifying anything else.

## Tracing

The process of observing system or program behavior at runtime by tracking events, function calls, system calls, or instructions.

Examples:
- strace   
  A Linux tool that traces system calls made by a process. Shows which syscalls run, with parameters and return values. Helps debug file access errors, permission issues, network errors.
- gdb   
  The GNU Debugger. Used to inspect and control program execution. Allows stepping through code, examining variables, breakpoints, backtraces, and analyzing core dumps.
- perf   
  A Linux performance-analysis tool that measures CPU events (cache misses, branch mispredicts), sampling profiles, and application hotspots. Useful for profiling and optimization.
- tcpdump   
  A packet-capture tool that records raw network packets. Helps debug network protocols, connectivity, latency, and security issues.

## BCC Tools

Short for BPF Compiler Collection. Set of high-level tools and libraries built on eBPF. It provides ready-made commands such as:

- `execsnoop` – Trace executed commands
- `opensnoop` – Trace file opens
- `tcpconnect` – Trace TCP connections
- `biolatency` – Show disk I/O latency

These tools give deep kernel visibility with minimal performance cost.

### BPF

Short for Berkeley Packet Filter. eBPF is a kernel technology that allows small, safe programs to run inside the kernel without changing the kernel code. Provides high-speed, low-overhead tracing, packet filtering, and performance analysis.

## Others

### Resource Allocation

OS allocates all available resources (CPU cycles, main memory, file storage) to processes and users using a system concurrently.

### Logging

Keeps track of of which users use how much and what kinds of computer resources.

### Protection

Controlling access of system resources to processes and users.

### Security

Protecting against internal and external. Uses user IDs, group IDs, access control mechanisms, and privilege escalation.

### Virtualization

Allows multiple guest OSes to run on top of a host OS. Achieved using a Virtual Machine Manager (VMM). Enables testing, isolation, and server consolidation.

### Emulation

Allows running binaries compiled for different CPU architectures on the host's CPU.

Other than the above-explained services, OS provides more services such as:

- I/O Operations  
  Provides access to I/O devices and files.
- Error Detection  
  Detects errors in CPU, memory, I/O devices, or user programs. Ensures consistent operation.
- Resource Allocation  
  CPU scheduling, memory allocation, file access, device management.
- Logging (Accounting)  
  Tracks resource usage.
- Protection and Security  
  Controls access rights, ensures processes do not interfere, uses authentication.
