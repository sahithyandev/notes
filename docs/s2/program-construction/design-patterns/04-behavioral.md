---
title: Behavioral Design Patterns
sidebar:
  order: 4
  label: Behavioral
slug: program-construction/design-patterns/behavioral
prev: true
next: false
---

Deals with how different kinds of objects interact with each other.

## Chain of Responsibility pattern

Allows a request to be passed along a chain of handlers until it is handled. Each handler decides whether to process the request or pass it to the next handler in the chain.

Used in logging frameworks, event handling systems, and middleware pipelines.

```java
abstract class Validator {
    private Validator next;

    public Validator linkWith(Validator next) {
        this.next = next;
        return next;
    }

    public boolean validate(String input) {
        if (!check(input)) return false;
        if (next == null) return true;
        return next.validate(input);
    }

    protected abstract boolean check(String input);
}

// Concrete Validators
class NotEmptyValidator extends Validator {
    protected boolean check(String input) {
        if (input == null || input.isEmpty()) {
            System.out.println("Validation failed: input is empty");
            return false;
        }
        return true;
    }
}

class EmailValidator extends Validator {
    protected boolean check(String input) {
        if (!input.contains("@")) {
            System.out.println("Validation failed: invalid email");
            return false;
        }
        return true;
    }
}

class LengthValidator extends Validator {
    protected boolean check(String input) {
        if (input.length() < 5) {
            System.out.println("Validation failed: input too short");
            return false;
        }
        return true;
    }
}

// Usage
public class ChainOfResponsibilityDemo {
    public static void main(String[] args) {
        Validator chain = new NotEmptyValidator();
        chain.linkWith(new EmailValidator())
             .linkWith(new LengthValidator());

        String input = "user@example.com";
        if (chain.validate(input)) {
            System.out.println("All validations passed");
        }
    }
}
```

Benefits:

- Reduces coupling between sender and receiver
- Adds flexibility in assigning responsibilities
- Simplifies object interactions

Drawbacks:

- May lead to unhandled requests if no handler processes them
- Debugging can be difficult due to dynamic request flow
- Can become complex with long chains



## Command pattern

Turns a request into a standalone Command object. Can be passed, queued, logged.

Used in controllers, job scheduling systems, user actions in GUI.

```java
import java.util.*;

interface Command {
    void execute();
    void undo();
}

class TextDocument {
    private StringBuilder content = new StringBuilder();

    public void write(String text) {
        content.append(text);
    }

    public void erase(int length) {
        content.delete(content.length() - length, content.length());
    }

    public String getContent() {
        return content.toString();
    }
}

class WriteCommand implements Command {
    private TextDocument doc;
    private String text;

    public WriteCommand(TextDocument doc, String text) {
        this.doc = doc;
        this.text = text;
    }
    public void execute() {
        doc.write(text);
    }
    public void undo() {
        doc.erase(text.length());
    }
}
class Editor {
    private Stack<Command> history = new Stack<>();
    public void executeCommand(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }
    public void undo() {
        if (!history.isEmpty()) {
            history.pop().undo();
        }
    }
}
public class CommandPatternExample {
    public static void main(String[] args) {
        TextDocument doc = new TextDocument();
        Editor editor = new Editor();

        Command writeHello = new WriteCommand(doc, "Hello");
        editor.executeCommand(writeHello);

        System.out.println(doc.getContent()); // Hello

        editor.undo();
        System.out.println(doc.getContent()); // (empty)
    }
}
```

Benefits:

- Loosen the coupling between invoker and receiver
- Can be serialized

Drawbacks:

- Overhead for simple operations – For very simple operations, the Command
  pattern introduces unnecessary complexity by creating multiple command
  objects.
- Difficult to implement with complex systems – In systems where commands can
  have many different types of parameters, the number of command objects may
  grow significantly, making the system harder to manage.
- Harder to maintain – As new commands are added, the invoker (client) and
  command interface may need modifications, leading to possible changes in other
  parts of the system.
  
## Interpreter pattern

Defines a way to evaluate sentences in a language by representing its grammar as a class hierarchy. Each rule in the grammar is represented by a class, and the interpretation is done by traversing the structure.

Used in SQL query parsing, mathematical expression evaluation, and configuration file parsing.

```java
// Abstract Expression - Defines the interface for interpreting expressions
interface Expression {
    int interpret();
}

// Terminal Expression - Represents numbers in the grammar
class NumberExpression implements Expression {
    private final int number;

    public NumberExpression(int number) {
        this.number = number;
    }

    @Override
    public int interpret() {
        return number;
    }
}

// Non-Terminal Expression - Represents addition in the grammar
class AddExpression implements Expression {
    private final Expression leftExpression;
    private final Expression rightExpression;

    public AddExpression(Expression leftExpression, Expression rightExpression) {
        this.leftExpression = leftExpression;
        this.rightExpression = rightExpression;
    }

    @Override
    public int interpret() {
        return leftExpression.interpret() + rightExpression.interpret();
    }
}

// Non-Terminal Expression - Represents subtraction in the grammar
class SubtractExpression implements Expression {
    private final Expression leftExpression;
    private final Expression rightExpression;

    public SubtractExpression(Expression leftExpression, Expression rightExpression) {
        this.leftExpression = leftExpression;
        this.rightExpression = rightExpression;
    }

    @Override
    public int interpret() {
        return leftExpression.interpret() - rightExpression.interpret();
    }
}

// Client - Demonstrates the Interpreter pattern
public class InterpreterPatternExample {
    public static void main(String[] args) {
        // Represents the expression: (5 + 3) - 2
        Expression five = new NumberExpression(5);
        Expression three = new NumberExpression(3);
        Expression two = new NumberExpression(2);

        Expression addition = new AddExpression(five, three); // (5 + 3)
        Expression subtraction = new SubtractExpression(addition, two); // (5 + 3) - 2

        System.out.println("Result: " + subtraction.interpret()); // Output: 6
    }
}
```

Benefits:

- Simplifies the implementation of complex grammars
- Easy to extend by adding new rules

Drawbacks:

- Can become complex with large grammars
- Performance issues with deeply nested expressions
  
## Iterator pattern

Provides a way to access elements of a collection sequentially without exposing the underlying representation.

Used in collections like lists, sets, and maps, or any data structure that needs sequential traversal.

```java
import java.util.*;

// Custom Collection
class UserGroup {
    private List<String> users = new ArrayList<>();

    public void addUser(String user) {
        users.add(user);
    }

    public Iterator<String> iterator() {
        return new UserIterator();
    }

    // Inner Iterator
    private class UserIterator implements Iterator<String> {
        private int index = 0;

        public boolean hasNext() {
            return index < users.size();
        }

        public String next() {
            return users.get(index++);
        }
    }
}

// Usage
public class IteratorPatternDemo {
    public static void main(String[] args) {
        UserGroup group = new UserGroup();
        group.addUser("Alice");
        group.addUser("Bob");
        group.addUser("Eve");

        Iterator<String> it = group.iterator();
        while (it.hasNext()) {
            System.out.println(it.next());
        }
    }
}
```

Benefits:

- Provides a uniform way to traverse different collections
- Encapsulates traversal logic, keeping it separate from the collection
- Supports multiple iterators on the same collection

Drawbacks:

- May not be suitable for very large collections due to memory overhead
- Can increase complexity for custom collections


## Mediator pattern

Defines an object that encapsulates how a set of objects interact. This pattern promotes loose coupling by keeping objects from referring to each other explicitly and allows their interaction to be varied independently.

Used in chat applications, traffic control systems, and GUI frameworks.

```java
import java.util.*;

// Mediator Interface
interface ChatRoomMediator {
    void sendMessage(String message, User sender);
    void addUser(User user);
}

// Concrete Mediator
class ChatRoom implements ChatRoomMediator {
    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        users.add(user);
    }

    public void sendMessage(String message, User sender) {
        for (User user : users) {
            if (user != sender) {
                user.receive(message);
            }
        }
    }
}

// Colleague
abstract class User {
    protected ChatRoomMediator chatRoom;
    protected String name;

    public User(String name, ChatRoomMediator chatRoom) {
        this.name = name;
        this.chatRoom = chatRoom;
    }

    public abstract void send(String message);
    public abstract void receive(String message);
}

// Concrete User
class ChatUser extends User {
    public ChatUser(String name, ChatRoomMediator chatRoom) {
        super(name, chatRoom);
    }

    public void send(String message) {
        System.out.println(name + " sends: " + message);
        chatRoom.sendMessage(message, this);
    }

    public void receive(String message) {
        System.out.println(name + " received: " + message);
    }
}

// Usage
public class MediatorChatExample {
    public static void main(String[] args) {
        ChatRoomMediator room = new ChatRoom();

        User alice = new ChatUser("Alice", room);
        User bob = new ChatUser("Bob", room);
        User eve = new ChatUser("Eve", room);

        room.addUser(alice);
        room.addUser(bob);
        room.addUser(eve);

        alice.send("Hello, everyone!");
        bob.send("Hey Alice!");
    }
}
```

Benefits:

- Reduces coupling between components
- Centralizes control of interactions
- Simplifies maintenance and testing

Drawbacks:

- Can become a bottleneck if the mediator grows too complex
- May introduce a single point of failure


## Momento pattern

Provides a way to store and restore the internal state of an object, without
breaking encapsulation. Used for implementing undo/redo.

```java
import java.util.Stack;

/**
 * Memento class that stores a snapshot of the text editor's state.
 * This class is immutable, meaning its state cannot be modified after creation.
 */
class TextEditorMemento {
    private final String content;  // The saved content of the editor.

    /**
     * Constructor initializes the memento with the editor's content.
     * @param content The text content to be saved.
     */
    public TextEditorMemento(String content) {
        this.content = content;
    }

    /**
     * Retrieves the saved content.
     * @return The stored text content.
     */
    public String getContent() {
        return content;
    }
}

/**
 * Originator: The TextEditor class that can save and restore its state.
 */
class TextEditor {
    private String content = "";  // Current content of the text editor.

    /**
     * Appends new text to the editor.
     * @param text The text to be added.
     */
    public void write(String text) {
        content += text;
    }

    /**
     * Retrieves the current content of the editor.
     * @return The editor's text content.
     */
    public String getContent() {
        return content;
    }

    /**
     * Saves the current state of the editor in a Memento object.
     * @return A new TextEditorMemento containing the current content.
     */
    public TextEditorMemento save() {
        return new TextEditorMemento(content);
    }

    /**
     * Restores the editor's content from a previously saved Memento.
     * @param memento The memento object containing the saved state.
     */
    public void restore(TextEditorMemento memento) {
        content = memento.getContent();
    }
}

/**
 * Caretaker: Manages the history of text editor states.
 * It keeps track of previous states and allows undo functionality.
 */
class History {
    private final Stack<TextEditorMemento> history = new Stack<>();  // Stack to store previous states.

    /**
     * Saves the current state of the editor by creating a new memento.
     * @param editor The text editor whose state is to be saved.
     */
    public void save(TextEditor editor) {
        history.push(editor.save());
    }

    /**
     * Restores the editor to the most recent saved state.
     * If no previous states exist, no changes are made.
     * @param editor The text editor to be restored.
     */
    public void undo(TextEditor editor) {
        if (!history.isEmpty()) {
            editor.restore(history.pop());
        }
    }
}

/**
 * Demonstrates the use of the Memento pattern in a text editor scenario.
 */
public class MementoPatternExample {
    public static void main(String[] args) {
        // Create a text editor and a history manager
        TextEditor editor = new TextEditor();
        History history = new History();

        // Write text and save state
        editor.write("Hello, ");
        history.save(editor);  // Save the state after writing "Hello, "

        editor.write("world!");
        history.save(editor);  // Save the state after writing "world!"

        System.out.println("Current content: " + editor.getContent());  // Output: Hello, world!

        // Undo the last action (removes "world!")
        history.undo(editor);
        System.out.println("After Undo: " + editor.getContent());  // Output: Hello,

        // Undo again (removes "Hello, ")
        history.undo(editor);
        System.out.println("After Another Undo: " + editor.getContent());  // Output: (empty)
    }
}
```

Encapsulation property is maintained. Not suitable when the state is complex, or large, or frequently changing.


## Observer pattern

Defines a one-to-many relationship between objects so that when one object
changes state, all its dependents are notified and updated automatically.

Used in event handling systems, MVC pattern (Model-View relationship),
publish-subscribe systems.

```java
import java.util.*;

// Observer Interface
interface Plugin {
    void onEvent(String event);
}

// Subject (Publisher)
class PluginManager {
    private List<Plugin> plugins = new ArrayList<>();

    public void register(Plugin plugin) {
        plugins.add(plugin);
    }

    public void fireEvent(String event) {
        for (Plugin plugin : plugins) {
            plugin.onEvent(event);
        }
    }
}

// Concrete Plugins
class AutoSavePlugin implements Plugin {
    public void onEvent(String event) {
        if (event.equals("file.close")) {
            System.out.println("Auto-saving file...");
        }
    }
}

class SyntaxCheckPlugin implements Plugin {
    public void onEvent(String event) {
        if (event.equals("file.save")) {
            System.out.println("Checking syntax...");
        }
    }
}

// Usage
public class PluginSystemDemo {
    public static void main(String[] args) {
        PluginManager manager = new PluginManager();

        manager.register(new AutoSavePlugin());
        manager.register(new SyntaxCheckPlugin());

        manager.fireEvent("file.save");
        manager.fireEvent("file.close");
    }
}
```

Benefits:

- Loose coupling between subject and observers
- Support for broadcast communication
- Easy to add new observers without modifying subject

Drawbacks:

- Memory leaks if observers aren't properly unregistered
- Unexpected updates if order of notification matters
- Performance impact with many observers

## Strategy pattern

Defines a family of algorithms, encapsulates each one, and makes them
interchangeable. Strategy lets the algorithm vary independently from clients
that use it.

Used for different sorting algorithms, payment methods, compression algorithms,
etc.

```java
Pinterface CompressionStrategy {
    void compress(String file);
}

class ZipCompression implements CompressionStrategy {
    public void compress(String file) {
        System.out.println("Compressing " + file + " using ZIP");
    }
}

class GzipCompression implements CompressionStrategy {
    public void compress(String file) {
        System.out.println("Compressing " + file + " using GZIP");
    }
}

class CompressionService {
    private CompressionStrategy strategy;

    public void setStrategy(CompressionStrategy strategy) {
        this.strategy = strategy;
    }

    public void compressFile(String file) {
        strategy.compress(file);
    }
}

public class StrategyPatternDemo {
    public static void main(String[] args) {
        CompressionService service = new CompressionService();

        service.setStrategy(new ZipCompression());
        service.compressFile("report.txt");

        service.setStrategy(new GzipCompression());
        service.compressFile("data.json");
    }
}
```

Benefits:

- Algorithms can be switched at runtime
- Isolates algorithm implementation details
- Promotes composition over inheritance

Drawbacks:

- Increased number of objects if many strategies
- Client must be aware of different strategies
- Strategy and Context interfaces may become complex

## State pattern

Allows an object to alter its behavior when its internal state changes,
appearing to change its class.

Used in workflow management, game state handling, user interface states, etc.

```java
interface ServerState {
    void start(ServerContext server);
    void handleRequest(ServerContext server);
    void stop(ServerContext server);
}
class StartingState implements ServerState {
    public void start(ServerContext server) {
        System.out.println("Server is already starting...");
    }

    public void handleRequest(ServerContext server) {
        System.out.println("Cannot handle request while starting.");
    }

    public void stop(ServerContext server) {
        System.out.println("Stopping server while starting...");
        server.setState(new StoppedState());
    }
}

class RunningState implements ServerState {
    public void start(ServerContext server) {
        System.out.println("Server is already running.");
    }

    public void handleRequest(ServerContext server) {
        System.out.println("Handling HTTP request.");
    }

    public void stop(ServerContext server) {
        System.out.println("Stopping the server...");
        server.setState(new StoppedState());
    }
}

class StoppedState implements ServerState {
    public void start(ServerContext server) {
        System.out.println("Starting the server...");
        server.setState(new StartingState());
    }

    public void handleRequest(ServerContext server) {
        System.out.println("Cannot handle request, server is stopped.");
    }

    public void stop(ServerContext server) {
        System.out.println("Server is already stopped.");
    }
}
class ServerContext {
    private ServerState state;

    public ServerContext() {
        state = new StoppedState();
    }

    public void setState(ServerState state) {
        this.state = state;
    }

    public void start() {
        state.start(this);
    }

    public void handleRequest() {
        state.handleRequest(this);
    }

    public void stop() {
        state.stop(this);
    }
}
```

Benefits:

- Organizes state-specific behavior
- Makes state transitions explicit
- Eliminates complex conditionals

Drawbacks:

- Can be overkill for simple state management
- Increased number of classes
- State transitions can become complex

## Template method pattern

Defines the structure of an algorithm and allows the steps of
the algorithm to be implemented or overridden by subclasses.

Used in parsing logic of different kinds of files, web frameworks for request
handling, plugin system, testing framework with lifecycle hooks.

```java
abstract class AuditedServiceOperation {
    public final void execute(String user) {
        logStart(user);
        performOperation();
        logEnd(user);
    }

    private void logStart(String user) {
        System.out.println("[AUDIT] " + user + " started operation");
    }

    private void logEnd(String user) {
        System.out.println("[AUDIT] " + user + " finished operation");
    }

    protected abstract void performOperation();
}
class CreateUserOperation extends AuditedServiceOperation {
    protected void performOperation() {
        System.out.println("Creating user in database...");
    }
}
class DeleteUserOperation extends AuditedServiceOperation {
    protected void performOperation() {
        System.out.println("Deleting user from database...");
    }
}
public class Main {
    public static void main(String[] args) {
        AuditedServiceOperation op1 = new CreateUserOperation();
        op1.execute("alice");

        System.out.println("---");

        AuditedServiceOperation op2 = new DeleteUserOperation();
        op2.execute("bob");
    }
}
```

## Visitor pattern

Allows adding new operations to objects without modifying them. The operation is
abstracted into a separate class.

Used for AST (Abstract Syntax Tree) traversal, serialization, graphic rendering, document generation,
etc.

```java
// Visitor Interface
interface ExprVisitor {
    int visit(NumberExpr n);
    int visit(AddExpr a);
    int visit(MulExpr m);
}

// Base Expression
interface Expr {
    int accept(ExprVisitor visitor);
}

// Leaf Node: Number
class NumberExpr implements Expr {
    int value;

    NumberExpr(int value) { this.value = value; }

    public int accept(ExprVisitor visitor) {
        return visitor.visit(this);
    }
}

// Composite Node: Addition
class AddExpr implements Expr {
    Expr left, right;

    AddExpr(Expr left, Expr right) {
        this.left = left;
        this.right = right;
    }

    public int accept(ExprVisitor visitor) {
        return visitor.visit(this);
    }
}

// Composite Node: Multiplication
class MulExpr implements Expr {
    Expr left, right;

    MulExpr(Expr left, Expr right) {
        this.left = left;
        this.right = right;
    }

    public int accept(ExprVisitor visitor) {
        return visitor.visit(this);
    }
}

// Concrete Visitor: Evaluate the expression
class EvalVisitor implements ExprVisitor {
    public int visit(NumberExpr n) {
        return n.value;
    }

    public int visit(AddExpr a) {
        return a.left.accept(this) + a.right.accept(this);
    }

    public int visit(MulExpr m) {
        return m.left.accept(this) * m.right.accept(this);
    }
}
```

Drawbacks:

- Open/closed principle is broken – Every time a new file type is added (e.g.,
  VideoFile), the visitor interface must be modified, which affects all concrete
  visitors.
- Increased complexity – More interfaces and classes make the system harder to
  understand for beginners.
- Not ideal for frequently changing structures – If the object structure (i.e.,
  file types) changes frequently, modifying all visitors becomes cumbersome.
