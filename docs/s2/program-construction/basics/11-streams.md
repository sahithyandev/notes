---
title: Streams
sidebar:
  order: 11
slug: program-construction/basics/streams
prev: true
next: true
---

Stream means a continuous flow of data. Stream is an object that reads from
a _source_ or write to a _destination_ or both. Used to output to a screen or a
read from a keyboard. Used when total memory is lesser than the incoming or
outgoing data. Used to process and transmit data progressively.

In Java, streams are used to perform input and output (I/O) operations.

## Types

### Based on data format

#### Byte-oriented

Handles data in raw binary format. Used for byte by byte input and output.

| Class                         | Description                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `InputStream`, `OutputStream` | Abstract superclass for all byte-oriented input & output streams. Used to read from or write bytes                                              |
| `FileInputStream`             | Reads raw bytes from a file. Useful for reading binary data like images or audio files.                                                         |
| `FileOutputStream`            | Writes raw bytes to a file. Useful for writing binary data.                                                                                     |
| `BufferedInputStream`         | Adds buffering to an `InputStream` for efficient reading of bytes. Reduces the number of I/O operations by reading chunks of data at a time.    |
| `BufferedOutputStream`        | Adds buffering to an `OutputStream` for efficient writing of bytes. Reduces the number of I/O operations by writing chunks of data at a time.   |
| `ByteArrayInputStream`        | Reads bytes from a byte array in memory. Useful for testing or manipulating byte data without involving external resources.                     |
| `ByteArrayOutputStream`       | Writes bytes to a byte array in memory. Useful for temporary storage and manipulation of byte data.                                             |
| `DataInputStream`             | Reads primitive data types (e.g., `int`, `float`) and strings from an underlying `InputStream`. Useful for reading structured binary data.      |
| `DataOutputStream`            | Writes primitive data types (e.g., `int`, `float`) and strings to an underlying `OutputStream`. Useful for writing structured binary data.      |
| `ObjectInputStream`           | Reads serialized objects from an underlying `InputStream`. Useful for deserializing objects in Java.                                            |
| `ObjectOutputStream`          | Writes serialized objects to an underlying `OutputStream`. Useful for serializing objects in Java.                                              |
| `FilterInputStream`           | Abstract class for creating input streams that filter data as it is read. Subclasses include `BufferedInputStream` and `DataInputStream`.       |
| `FilterOutputStream`          | Abstract class for creating output streams that filter data as it is written. Subclasses include `BufferedOutputStream` and `DataOutputStream`. |

#### Character-oriented

Handles data in the form of characters (16-bit Unicode). Used for input and
output of characters. Built on top of byte oriented streams. Automatically handle character encoding, line endings. In Java, the main classes to work with character streams
are:

In the below example, output file is written as the input file is being read.
This approach can be used to copy a huge file as well.

```java
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class CharacterStreamExample {
    public static void main(String[] args) {
        try (FileReader fr = new FileReader("input.txt");
             FileWriter fw = new FileWriter("output.txt")) {
            int charData;
            while ((charData = fr.read()) != -1) {
                fw.write(charData);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

| Class                                | Description                                                                                                                                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Reader`, `Writer`                   | Abstract superclass for all character stream inputs and outputs. Used for reading and writing text data.                                                                                                   |
| `FileReader`, `FileWriter`           | Reads or writes characters from a file, using the system's default character encoding.                                                                                                                     |
| `BufferedReader`, `BufferedWriter`   | Adds buffering to a `Reader` for efficient character reading or writing.                                                                                                                                   |
| `InputStreamReader`                  | Bridge from byte streams (`InputStream`) to character streams (`Reader`). Decodes bytes into characters. Specify encoding for international text.                                                          |
| `OutputStreamWriter`                 | Bridge from character streams (`Writer`) to byte streams (`OutputStream`). Encodes characters into bytes. Specify encoding for international text.                                                         |
| `PrintWriter`                        | Writes formatted representations of objects to a text-output stream. Offers `print()`, `println()`, `printf()`, and auto-flushing. Preferred over `PrintStream` for text output due to character handling. |
| `CharArrayReader`, `CharArrayWriter` | Reads characters from or writes characters to a character array. Useful for temporary storage and manipulation of character data in memory.                                                                |

### Based on direction of data flow

#### Input stream

- `InputStream` - an abstract class that represents an input stream of bytes.
  Provides methods to read bytes from a source.
- `Reader`

Common subclasses of `InputStream` include:

- `FileInputStream` for reading from files.
- `ByteArrayInputStream` for reading from byte arrays.
- `BufferedInputStream` for buffering input to improve performance.

Common subclasses of `Reader` include:

- `FileReader`
- `CharArrayReader`
- `BufferedReader`

#### Output stream

In Java:

- `OutputStream` - an abstract class that represents an output stream of bytes.
  Provides methods to write bytes to a destination.
- `Writer`

Common subclasses of `OutputStream` include:

- `FileOutputStream` for writing to files.
- `ByteArrayOutputStream` for writing to byte arrays.
- `BufferedOutputStream` for buffering output to improve performance.

Common subclasses of `Writer` include:

- `FileWriter`
- `CharArrayWriter`
- `BufferedWriter`

### Based on connection

#### Connection stream

A stream that connects to a source or destination. A file or socket, or a network connection.

Examples:

- `FileInputStream`
- `FileOutputStream`

#### Chain stream

Aka. filtered stream, wrapper streams. A stream that reads from or writes to a connection stream. Works only if chained to other streams. Adheres to decorator pattern.

Examples:

- `BufferedReader`

#### Example

Suppose there's a `numbers.txt` containing a list of numbers (one per line). We want to remove non-integers first, then double the remaining numbers. And finally we want to write the results to a new file `output.txt`.

<svg xmlns="http://www.w3.org/2000/svg" width="1106.3" height="502.6">
  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M53 356c85 0 173-2 232 0m-232 0h232m0 0v75m0-75v75m0 0H53m232 0c-80 2-160 2-232 0m0 0v-75m0 75c-2-24-1-48 0-75"/><text x="57.5" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(111 381)">numbers.txt</text><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M864 350h232m-232 0c93 1 186 2 232 0m0 0v75m0-75v75m0 0c-74 3-146 2-232 0m232 0H864m0 0v-75m0 75v-75"/><text x="53.1" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(927 375)">output.txt</text><text y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(10 443)">contains a list of numbers</text><text y="42.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(10 443)">each number is in separate lines</text><text y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(146 10)">filter the lines having a non-integer</text><text y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(685 29)">multiplies each number by 2</text><g stroke-linecap="round"><path fill="none" d="m60 210 239 1 1 62-240-4"/><path fill="none" stroke="#1971c2" stroke-width="4" d="M61 210c74-1 149-2 240 0m-240 0c96-2 190-2 240 0m0 0v61m0-61c-2 22-1 43 0 61m0 0H61m240 0H61m0 0v-61m0 61v-61"/></g><text x="50.7" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(130 228)">FileReader</text><g stroke-linecap="round"><path fill="none" d="m434 240 41 1-1 33-40 1"/><path fill="none" stroke="#1971c2" stroke-width="4" d="M434 240h41m-41 0h41m0 0v35m0-35v35m0 0h-41m41 0h-41m0 0v-35m0 35v-35"/></g><g stroke-linecap="round"><path fill="transparent" d="m436 291 40 1v35l-40-1"/><path fill="none" stroke="#e03131" stroke-width="4" d="M435 292h41m-41 0h41m0 0v35m0-35v35m0 0h-41m41 0h-41m0 0v-35m0 35v-35"/></g><g stroke-linecap="round"><path fill="transparent" d="m169 52 240 1v61l-240-2"/><path fill="none" stroke="#e03131" stroke-width="4" d="M168 52c87 1 176 2 240 0m-240 0h240m0 0c2 22 2 43 0 61m0-61v61m0 0H168m240 0c-49 1-97 3-240 0m0 0V52m0 61V52"/></g><text x="96.4" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(192 70)">IntegerFilterStream</text><g stroke-linecap="round"><path fill="transparent" d="M693 67h238l-1 64H691"/><path fill="none" stroke="#e03131" stroke-width="4" d="M691 68c77 3 155 1 240 0m-240 0h240m0 0c1 15-2 32 0 61m0-61v61m0 0H691m240 0c-49 2-97 1-240 0m0 0V68m0 61V68"/></g><text x="73.8" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(737 86)">DoublingStream</text><g stroke-linecap="round"><path fill="none" d="M843 189h237l3 63-242-1"/><path fill="none" stroke="#1971c2" stroke-width="4" d="M842 190c83 3 169 0 240 0m-240 0h240m0 0c1 15-2 28 0 60m0-60v60m0 0H842m240 0H842m0 0c2-23 1-48 0-60m0 60v-60"/></g><text x="46.1" y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" text-anchor="middle" transform="translate(916 207)">FileWriter</text><path fill="none" stroke="currentColor" stroke-linecap="round" d="m208 341 5-59m-4 62 4-60m7 24c-4-7-5-15-7-24m7 24-7-24m-10 23 10-23m-10 23c2-8 5-13 10-23m3-84 62-74m-60 73 59-75m-8 24 8-24m-8 24c1-7 6-14 8-24m-21 13c6-4 14-7 21-13m-21 13 21-13m618 18 59 38m-60-39 59 40m-24-6 24 6m-24-6 24 6m-15-20 15 20m-15-20 15 20M417 94l266-4m-268 4 267-2m-24 8c8-2 11-2 24-8m-24 8 24-8m-24-9c8 2 11 6 24 9m-24-9 24 9m285 168 13 79m-14-80 13 81m-13-21c5 8 8 18 13 21m-13-21 13 21m4-24c-1 9-5 20-4 24m4-24-4 24"/><text y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(484 245)">Connection stream</text><text y="17.6" fill="currentColor" dominant-baseline="alphabetic" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20" style="white-space:pre" transform="translate(485 297)">Chain stream</text></svg>
