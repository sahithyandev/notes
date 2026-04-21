---
title: Structural Design Patterns
sidebar:
  order: 3
  label: Structural
slug: program-construction/design-patterns/structural
prev: true
next: true
---

Deals with how classes are designed.

## Adapter Pattern

Allows incompatible interfaces to work together. Acts as a bridge between the two. Useful when working with legacy code or third-party libraries that have different interfaces.

```java
public interface AppLogger {
    void log(String message);
}
public class ThirdPartyLogger {
    public void writeLog(String msg) {
        System.out.println("3rd-Party Log: " + msg);
    }
}
public class LoggerAdapter implements AppLogger {
    private ThirdPartyLogger thirdPartyLogger;

    public LoggerAdapter(ThirdPartyLogger logger) {
        this.thirdPartyLogger = logger;
    }

    public void log(String message) {
        thirdPartyLogger.writeLog(message);
    }
}
public class Main {
    public static void main(String[] args) {
        AppLogger logger = new LoggerAdapter(new ThirdPartyLogger());
        logger.log("User logged in.");  // Output: 3rd-Party Log: User logged in.
    }
}
```

## Bridge Pattern

Decouples abstraction and implementation. Used to split large classes into separate hierarchies which can be developed
independently. There are 2 layer of classes.

- Abstraction layer - high-level control logic
- Implementation layer - underlying code

Provides a _bridge_ between 2 types of classes having multiple variants.

Used in rendering engines where different shapes can be drawn using different rendering contexts.

```java
interface Renderer {
    void renderShape(String shapeType, String details);
}

class OpenGLRenderer implements Renderer {
    public void renderShape(String shapeType, String details) {
        System.out.println("Using OpenGL to render " + shapeType + ": " + details);
    }
}

class DirectXRenderer implements Renderer {
    public void renderShape(String shapeType, String details) {
        System.out.println("Using DirectX to render " + shapeType + ": " + details);
    }
}

abstract class Shape {
    protected Renderer renderer;

    protected Shape(Renderer renderer) {
        this.renderer = renderer;
    }

    abstract void draw();
}

class Circle extends Shape {
    private double radius;

    public Circle(Renderer renderer, double radius) {
        super(renderer);
        this.radius = radius;
    }

    public void draw() {
        renderer.renderShape("Circle", "Radius=" + radius);
    }
}

class Square extends Shape {
    private double side;

    public Square(Renderer renderer, double side) {
        super(renderer);
        this.side = side;
    }

    public void draw() {
        renderer.renderShape("Square", "Side=" + side);
    }
}

public class Main {
    public static void main(String[] args) {
        // Create shapes with OpenGL renderer
        Renderer openGL = new OpenGLRenderer();
        Shape circle = new Circle(openGL, 5.0);
        Shape square = new Square(openGL, 4.0);

        circle.draw();
        square.draw();

        // Switch to DirectX renderer
        Renderer directX = new DirectXRenderer();
        circle = new Circle(directX, 5.0);
        square = new Square(directX, 4.0);

        circle.draw();
        square.draw();
    }
}
```

## Composite Pattern

Treats individual objects and compositions of objects uniformly. Useful when you need to work with tree structures

Used in file systems, and graphical user interfaces.

```java
import java.util.ArrayList;
import java.util.List;

// Component interface
interface FileSystemItem {
    void display(String indent);
}

// Leaf class
class File implements FileSystemItem {
    private final String name;

    public File(String name) {
        this.name = name;
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "File: " + name);
    }
}

// Composite class
class Directory implements FileSystemItem {
    private final String name;
    private final List<FileSystemItem> children = new ArrayList<>();

    public Directory(String name) {
        this.name = name;
    }

    public void add(FileSystemItem item) {
        children.add(item);
    }

    public void remove(FileSystemItem item) {
        children.remove(item);
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "Directory: " + name);
        for (FileSystemItem item : children) {
            item.display(indent + "  ");
        }
    }
}

// Client code
public class FileSystemExample {
    public static void main(String[] args) {
        // Create files
        File file1 = new File("file1.txt");
        File file2 = new File("file2.txt");
        File file3 = new File("file3.txt");

        // Create directories
        Directory dir1 = new Directory("dir1");
        Directory dir2 = new Directory("dir2");

        // Build the file system structure
        dir1.add(file1);
        dir1.add(file2);
        dir2.add(file3);
        dir2.add(dir1);

        // Display the file system structure
        dir2.display("");
    }
}
```

## Flyweight Pattern

Aims to minimize memory usage by sharing as much data as possible with similar
objects. Useful when dealing with a large number of
objects that have some shared state.

- Flyweight Factory: Ensures that flyweight objects are shared
  and reused. Maintains a pool of flyweight objects and returns existing
  objects from the pool instead of creating new ones.
- Flyweight Object: Contains the intrinsic state and methods to
  operate on it.

Used in applications like text editors, game development, graphics systems, caching systems, and document management systems.

```java
import java.util.HashMap;
import java.util.Map;

public interface Glyph {
    void render(int position);
}
public class CharacterGlyph implements Glyph {
    // intrinsic state
    private final char character;
    private final String font;

    public CharacterGlyph(char character, String font) {
        this.character = character;
        this.font = font;
    }

    @Override
    public void render(int position) {
        System.out.println("Render '" + character + "' with font '" + font + "' at position " + position);
    }
}
public class GlyphFactory {
    private final Map<String, Glyph> pool = new HashMap<>();

    public Glyph getGlyph(char character, String font) {
        String key = character + "-" + font;
        if (!pool.containsKey(key)) {
            pool.put(key, new CharacterGlyph(character, font));
        }
        return pool.get(key);
    }
}
public class TextEditor {
    public static void main(String[] args) {
        GlyphFactory factory = new GlyphFactory();
        String text = "hello world";

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            Glyph glyph = factory.getGlyph(c, "Arial");
            glyph.render(i);
        }
    }
}
```

## Decorator Pattern

Allows attaching new behaviors to objects using wrapper objects
that contain these behaviors.

Used in web frameworks, .

```java
class HttpHandler {
    handle(request, response) {
        response.send("Hello World");
    }
}

class MiddlewareDecorator {
    constructor(handler) {
        this.handler = handler;
    }
    
    handle(request, response) {
        this.handler.handle(request, response);
    }
}

class AuthenticationMiddleware extends MiddlewareDecorator {
    handle(request, response) {
        console.log("Checking authentication...");
        if (!request.headers.authorization) {
            response.status(401).send("Unauthorized");
            return;
        }
        super.handle(request, response);
    }
}

class LoggingMiddleware extends MiddlewareDecorator {
    handle(request, response) {
        console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
        super.handle(request, response);
        console.log("Request completed");
    }
}

class CompressionMiddleware extends MiddlewareDecorator {
    handle(request, response) {
        console.log("Applying gzip compression...");
        response.setHeader('Content-Encoding', 'gzip');
        super.handle(request, response);
    }
}


// Usage - stack decorators in any order
let handler = new CompressionMiddleware(
    new LoggingMiddleware(
        new AuthenticationMiddleware(
            new HttpHandler()
        )
    )
);
```

## Facade Pattern

Provides a simplified wrapper for a collection of classes. Hides the complexities of the system and provides a unified interface to the client.

Used in third party API clients.

```java
class SMTPClient {
    void connect() { System.out.println("Connected to SMTP"); }
    void authenticate() { System.out.println("Authenticated"); }
    void send(String mimeMessage) { System.out.println("Sent: " + mimeMessage); }
}
class MimeBuilder {
    String build(String to, String subject, String body) {
        return "[MIME] To: " + to + ", Subject: " + subject + ", Body: " + body;
    }
}
class Logger {
    void log(String message) {
        System.out.println("Logged: " + message);
    }
}
public class EmailService {
    private SMTPClient smtp = new SMTPClient();
    private MimeBuilder builder = new MimeBuilder();
    private Logger logger = new Logger();

    public void sendEmail(String to, String subject, String body) {
        smtp.connect();
        smtp.authenticate();
        String message = builder.build(to, subject, body);
        smtp.send(message);
        logger.log("Email sent to " + to);
    }
}
public class Main {
    public static void main(String[] args) {
        EmailService emailService = new EmailService();
        emailService.sendEmail("john@example.com", "Invoice", "Your invoice is attached.");
    }
}
```

## Proxy Pattern

Provides a placeholder or a filter for another object to control access to it. Used to add an additional layer of control, such as lazy initialization, access control, logging, or caching, without changing the original object's code.

Used in HTTP server frameworks, preview UIs.

### Types of Proxy

1. Virtual Proxy: Used for lazy initialization and caching.
2. Protection Proxy: Controls access to the real object based on permissions.
3. Remote Proxy: Represents an object located in a different address space.
4. Smart Proxy: Adds additional functionality, such as reference counting or logging.

```java
class FileProxy implements File {
    private RealFile real;
    private String filename;
    
    public FileProxy(String filename) {
        this.filename = filename;
    }
    public void open() {
        if (real == null) {
            real = new RealFile(filename);
        }
        real.open();
    }
}
```
