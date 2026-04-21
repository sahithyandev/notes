---
title: Creational Design Patterns
sidebar:
  order: 2
  label: Creational
slug: program-construction/design-patterns/creational
prev: true
next: true
---

Deals with how classes are created.

## Builder Pattern

Separates the construction of a complex object from its representation. Provides
a step-by-step process. Useful when the attributes are too many and optional.

Used in SQL query builders, HTTP request and response builders, etc.

```java
// Product class - Represents the HTTP request being built
class HttpRequest {
    private final String method;
    private final String url;
    private final String body;
    private final Map<String, String> headers;

    // Private constructor ensures objects can only be created through Builder
    private HttpRequest(HttpRequestBuilder builder) {
        this.method = builder.method;
        this.url = builder.url;
        this.body = builder.body;
        this.headers = builder.headers;
    }

    @Override
    public String toString() {
        return "HttpRequest{" +
                "method='" + method + '\'' +
                ", url='" + url + '\'' +
                ", body='" + body + '\'' +
                ", headers=" + headers +
                '}';
    }

    // Static Builder class
    public static class HttpRequestBuilder {
        private String url;
        // optional values
        private String method = "GET";
        private String body = "";
        private Map<String, String> headers = new HashMap<>();

        public HttpRequestBuilder(String url) {
            this.url = url;
        }

        public HttpRequestBuilder method(String method) {
            this.method = method;
            return this;
        }

        public HttpRequestBuilder body(String body) {
            this.body = body;
            return this;
        }

        public HttpRequestBuilder addHeader(String key, String value) {
            this.headers.put(key, value);
            return this;
        }

        public HttpRequest build() {
            return new HttpRequest(this);
        }
    }
}

// Client - Demonstrates how to use the Builder pattern
public class BuilderPatternExample {
    public static void main(String[] args) {
        // Construct an HTTP POST request using the Builder
        HttpRequest request = new HttpRequest.HttpRequestBuilder("https://api.example.com/users")
                .method("POST")
                .body("{\"name\":\"John Doe\", \"email\":\"john@example.com\"}")
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer xyz123")
                .build();

        System.out.println(request);
    }
}
```

## Singleton Pattern

Ensures only one instances of a class exists. Provides global access to the single instance.

Used in logging, thread pools, database connections, etc.

```java
public class DatabaseConnection {
  private static DatabaseConnection instance;

  private DatabaseConnection() {
    // private constructor to prevent instantiation from outside
    // creates a database
  }

  public static DatabaseConnection getInstance() {
    if (instance == null) {
      instance = new DatabaseConnection();
    }
    return instance;
  }
}
```

The above code is not thread-safe. To make it thread-safe, double-checked locking can be used.

## Factory Pattern

Provides an interface for creating objects of different variants. The type of the
object is passed to the factory method.

Used in loggers, notification systems, testing frameworks.

```java
class Logger {
    public void log(String message) {}
}

class ConsoleLogger extends Logger {
    @Override
    public void log(String message) {
        System.out.println("LOG: " + message);
    }
}

class FileLogger extends Logger {
    private String filePath;

    public FileLogger(String filePath) {
        this.filePath = filePath;
    }

    @Override
    public void log(String message) {
        try (FileWriter writer = new FileWriter(filePath, true)) {
            writer.write("LOG: " + message + "\n");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

class LoggerFactory {
    public static Logger createLogger(String type, String filePath) {
        if (type.equalsIgnoreCase("CONSOLE")) {
            return new ConsoleLogger();
        } else if (type.equalsIgnoreCase("FILE")) {
            return new FileLogger(filePath);
        }
        throw new IllegalArgumentException("Unknown logger type: " + type);
    }
}

public class LoggerFactoryExample {
    public static void main(String[] args) {
        Logger consoleLogger = LoggerFactory.createLogger("CONSOLE", null);
        consoleLogger.log("Logging to console");

        Logger fileLogger = LoggerFactory.createLogger("FILE", "log.txt");
        fileLogger.log("Logging to file");
    }
}
```

## Abstract Factory Pattern

Provides an interface for creating families of related objects without
specifying their concrete classes. Like a factory for factories. Used
when multiple objects need to be created that work together.

Used in UI toolkits with multiple themes, in cross-platform component toolkits, and in media players to handle different codecs with different decoders.

```java
// Step 1: Define abstract products
interface Button {
    void render();
}

interface Checkbox {
    void render();
}

// Step 2: Create concrete products for each theme
class LightButton implements Button {
    @Override
    public void render() {
        System.out.println("Rendering light theme button");
    }
}

class DarkButton implements Button {
    @Override
    public void render() {
        System.out.println("Rendering dark theme button");
    }
}

class LightCheckbox implements Checkbox {
    @Override
    public void render() {
        System.out.println("Rendering light theme checkbox");
    }
}

class DarkCheckbox implements Checkbox {
    @Override
    public void render() {
        System.out.println("Rendering dark theme checkbox");
    }
}

// Step 3: Define abstract factory interface
interface ThemeFactory {
    Button createButton();
    Checkbox createCheckbox();
}

// Step 4: Create concrete factories
class LightThemeFactory implements ThemeFactory {
    @Override
    public Button createButton() {
        return new LightButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new LightCheckbox();
    }
}

class DarkThemeFactory implements ThemeFactory {
    @Override
    public Button createButton() {
        return new DarkButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new DarkCheckbox();
    }
}

// Step 5: Client code using the Abstract Factory
public class AbstractFactoryPatternExample {
    public static void main(String[] args) {
        ThemeFactory factory = new LightThemeFactory();
        Button button = factory.createButton();
        Checkbox checkbox = factory.createCheckbox();

        button.render();   // Outputs: Rendering light theme button
        checkbox.render(); // Outputs: Rendering light theme checkbox

        factory = new DarkThemeFactory();
        button = factory.createButton();
        checkbox = factory.createCheckbox();

        button.render();   // Outputs: Rendering dark theme button
        checkbox.render(); // Outputs: Rendering dark theme checkbox
    }
}
```

## Prototype Pattern

Provides a way to copy existing objects without making the code dependent on their classes. Used to duplicate objects in a performant manner. Useful when object creation is expensive or complex.

```java
// Step 1: Create an abstract class implementing Cloneable
// `Cloneable` is a marker interface, defined in java.lang,
// which indicates that an object can be cloned.
abstract class Shape implements Cloneable {
    private String id;
    protected String type;

    abstract void draw();

    public String getType() {
        return type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public Object clone() {
        Object clone = null;
        try {
            clone = super.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return clone;
    }
}

// Step 2: Create concrete classes extending the abstract class
class Circle extends Shape {
    public Circle() {
        type = "Circle";
    }

    @Override
    void draw() {
        System.out.println("Drawing a Circle");
    }
}

class Rectangle extends Shape {
    public Rectangle() {
        type = "Rectangle";
    }

    @Override
    void draw() {
        System.out.println("Drawing a Rectangle");
    }
}

// Step 3: Create a class to get concrete classes from a cache
class ShapeCache {
    private static Map<String, Shape> shapeMap = new HashMap<>();

    public static Shape getShape(String shapeId) {
        Shape cachedShape = shapeMap.get(shapeId);
        return (Shape) cachedShape.clone();
    }

    public static void loadCache() {
        Circle circle = new Circle();
        circle.setId("1");
        shapeMap.put(circle.getId(), circle);

        Rectangle rectangle = new Rectangle();
        rectangle.setId("2");
        shapeMap.put(rectangle.getId(), rectangle);
    }
}

// Step 4: Client code using the Prototype Pattern
public class PrototypePatternExample {
    public static void main(String[] args) {
        ShapeCache.loadCache();

        Shape clonedShape1 = ShapeCache.getShape("1");
        System.out.println("Shape: " + clonedShape1.getType());
        clonedShape1.draw();

        Shape clonedShape2 = ShapeCache.getShape("2");
        System.out.println("Shape: " + clonedShape2.getType());
        clonedShape2.draw();
    }
}
```

In this example, the `ShapeCache` class stores a cache of objects. When a client requests a shape, it clones the cached object instead of creating a new one, improving performance and reducing complexity.
