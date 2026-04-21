---
title: File Processing
sidebar:
  order: 12
slug: program-construction/basics/file-processing
prev: true
next: true
---

In Java, reading from files and writing to files are handled using streams. Any
operation can throw an exception.

A file opened for writing must be closed before it can be opened for reading, or
vice versa.

### File class

Representation of a file or directory in Java. A safer way of representing file or folders compared to a path string.

## Writing

```java
import java.io.*;

class WriteAFile {
  public static void main (String[] args) {
    try {
      FileWriter writer = new FileWriter(“foo.txt”); // creates foo.txt if doesn't exist
      writer.write(“hello foo!”);
      writer.close(); // if not closed, when the program ends abnormally, the file might get corrupt
    } catch(IOException ex) {
      ex.printStackTrace();
    }
  }
}
```

## Reading

```java
import java.io.*;

class ReadAFile {
  public static void main (String[] args) {
    try {
      FileReader reader = new FileReader("foo.txt");
      BufferedReader bufferedReader = new BufferedReader(reader);

      String line;
      while ((line = bufferedReader.readLine()) != null) {
        System.out.println(line);
      }
      bufferedReader.close();
    } catch(IOException ex) {
      ex.printStackTrace();
    }
  }
}
```

## Buffering

By default, in Java, each byte is read/written from/to disk as soon as possible.
Each byte will have a little delay as the disk operations are slower. Causes
performance issues.

Buffering is a solution. Instead of reading/writing from/to disk instantly, the
data is read/written in _chunks_. A buffer (fixed-length memory) is allocated
for temporarily storing the chunk. When writing, disk is accessed only when the
buffer is full. When reading, the operation have to wait until the chunk is
filled from the disk.

`BufferedReader` and `BufferedWriter` can be used for this purpose.
