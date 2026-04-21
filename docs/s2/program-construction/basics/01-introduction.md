---
title: Introduction to Program Construction
sidebar:
  label: Introduction
  order: 1
slug: program-construction/basics/introduction
prev: false
next: true
---

Program construction is a methodological process that starts from a user's
requirements and end with a working program.

:::note

Programming is only one step among the many in program construction process.

:::

## The methodology

Has many different phases.

### System level

Covers overall system including hardware, software, users, operating environment, rules and more.

- System requirements analysis   
  Identify and document the needs and expectations of the users and stakeholders for the system.
- System requirements specification   
  Translate the analyzed requirements into a clear, detailed, and structured document that serves as a reference for development.
- System architecture design   
  Define the overall structure and components of the system, including hardware, software, and interactions, to ensure it meets the specified requirements.
- System validation   
  Verify that the system requirements specification accurately reflects the customer’s needs and expectations.

### Software level

Covers software aspect only.

- Software requirements analysis  
  Examine and understand the needs of the software to ensure alignment with user and system requirements.
- Software requirements specification  
  Document the analyzed requirements in a structured format to guide development and ensure clarity.
- Software architecture design  
  Plan the high-level structure of the software, including components and their interactions, to meet specified requirements.
- Software component/module design  
  Break down the architecture into smaller, manageable modules with detailed designs for implementation.
- Program coding and testing  
  Write the code for the software and test it to ensure functionality and correctness.
- Software deployment and maintenance  
  Release the software to users and provide ongoing updates and fixes to address issues and improve performance.
- Software verification  
  Confirm that the software meets the documented specifications and fulfills its intended purpose.

## Requirements

Detailed descriptions of the capabilities, behaviors, and constraints that a system or software must fulfill to meet the needs of its users and stakeholders. Serve as the foundation for all subsequent phases of development.

### Functional requirements

A statement of a piece of required functionality or a behavior that a system
will exhibit under specific conditions.

The above definition is from Grady Booch, James Rumbaugh, and Ivar Jacobson and
is a generally accepted one.

Describes "what" the system should do. Can either be defined by functionality or by behaviour.

### Non-functional requirements

Specifies criteria that can be used to judge the operation of
a system. Describes "how" the system should perform its functions. Conveniently identified as _illities_. These are subjetive, ambigous and conflicting.

Examples:

- Usability
- Reliability
- Safety
- Responsiveness

### Summary

|               | Functional req.            | Non-functional req.             |
| ------------- | -------------------------- | ------------------------------- |
| Objective     | Describe what product does | Describe how product works      |
| End result    | Define product features    | Define product properties       |
| Focus         | On user requirements       | On user expectations            |
| Documentation | Captured in use cases      | Captured as a quality attribute |
| Origin type   | Defined by user            | Defined by developers           |
