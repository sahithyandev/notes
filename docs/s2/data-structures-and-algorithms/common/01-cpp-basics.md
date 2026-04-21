---
title: C++ Basics
sidebar:
  order: 1
slug: data-structures-and-algorithms/common/cpp-basics
prev: false
next: false
---

### Header files

Files with a `.h` or `.hpp` extension that contain declarations of functions, classes, variables, and other constructs. They allow code to be shared across multiple source files by including the header file using the `#include` directive.

:::note

- `#include <iostream>` - Provides functionality for input and output operations, such as reading from the console (`std::cin`) and writing to the console (`std::cout`).
- `#include <bits/stdc++.h>` - Includes almost all standard library headers. But it increases the compile time.

:::

### Namespace

Used to organize code and prevent name conflicts. They provide a way to group related classes, functions, and variables under a unique identifier. The scope resolution operator `::` is used to access elements within a namespace.

The `std` namespace contains all the standard library functions and objects.

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

To avoid repeatedly specifying the namespace, `using namespace` directive can be used. This directive brings all the names from the specified namespace into the current scope. Might lead to name conflicts in large projects.

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

## Standard Library

### Containers

Container classes are used to store and manage collections of data.

#### Sequential

Store elements in a linear order.

- [`std::vector`](https://en.cppreference.com/w/cpp/container/vector): Dynamic array that can grow or shrink in size.
- [`std::deque`](https://en.cppreference.com/w/cpp/container/deque): Double-ended queue that allows insertion and deletion at both ends.
- [`std::list`](https://en.cppreference.com/w/cpp/container/list): Doubly linked list for efficient insertion and deletion.
- [`std::stack`](https://en.cppreference.com/w/cpp/container/stack): Adapts other containers to provide stack (LIFO) functionality.
- [`std::queue`](https://en.cppreference.com/w/cpp/container/queue): Adapts other containers to provide queue (FIFO) functionality.
- [`std::priority_queue`](https://en.cppreference.com/w/cpp/container/priority_queue): Provides a container adapter that maintains elements in a priority order.

#### Associative

Store elements in a sorted order and allow fast retrieval based on keys.

- [`std::set`](https://en.cppreference.com/w/cpp/container/set): Stores unique elements in sorted order.
- [`std::map`](https://en.cppreference.com/w/cpp/container/map): Stores key-value pairs with unique keys in sorted order.

#### Unordered

Store elements in an unsorted order but provide faster average lookup times using hash tables.

- [`std::unordered_set`](https://en.cppreference.com/w/cpp/container/unordered_set): Stores unique elements without any specific order.
- [`std::unordered_map`](https://en.cppreference.com/w/cpp/container/unordered_map): Stores key-value pairs without any specific order.

#### Utility

Provide specialized ways to group or manage data.

- [`std::pair`](https://en.cppreference.com/w/cpp/utility/pair): Groups two values together, which can be of different types.
- [`std::tuple`](https://en.cppreference.com/w/cpp/utility/tuple): Groups multiple values together, which can be of different types.
- [`std::string`](https://en.cppreference.com/w/cpp/string/basic_string): Represents a sequence of characters and provides various operations for string manipulation.

### Algorithms

#### Sorting

- [`std::sort`](https://en.cppreference.com/w/cpp/algorithm/sort): Sorts elements in ascending order in a range. $O(N \log N)$ average.
- [`std::stable_sort`](https://en.cppreference.com/w/cpp/algorithm/stable_sort): Sorts elements in a range while preserving the relative order of equivalent elements.
- [`std::partial_sort`](https://en.cppreference.com/w/cpp/algorithm/partial_sort): Rearranges elements so that the smallest `k` elements are sorted, and the rest remain unsorted.
- [`std::nth_element`](https://en.cppreference.com/w/cpp/algorithm/nth_element): Partially sorts elements such that the element at the nth position is the one that would be in that position in a fully sorted range, with all smaller elements before it and all larger elements after it.

#### Searching

- [`std::binary_search`](https://en.cppreference.com/w/cpp/algorithm/binary_search): Checks if a value exists in a sorted range. Returns `true` if the value is found.
- [`std::lower_bound`](https://en.cppreference.com/w/cpp/algorithm/lower_bound): Finds the first position in a sorted range where a value can be inserted without violating the order.
- [`std::upper_bound`](https://en.cppreference.com/w/cpp/algorithm/upper_bound): Finds the first position in a sorted range where a value can be inserted after all equivalent elements.
- [`std::equal_range`](https://en.cppreference.com/w/cpp/algorithm/equal_range): Returns a pair of iterators defining the range of elements equivalent to a given value in a sorted range.

#### Permutations

- [`std::next_permutation`](https://en.cppreference.com/w/cpp/algorithm/next_permutation): Rearranges elements into the next lexicographically greater permutation. Returns `false` if no such permutation exists.
- [`std::prev_permutation`](https://en.cppreference.com/w/cpp/algorithm/prev_permutation): Rearranges elements into the next lexicographically smaller permutation. Returns `false` if no such permutation exists.

#### Other

- [`std::find`](https://en.cppreference.com/w/cpp/algorithm/find): Searches for a specific value in a range.
- [`std::accumulate`](https://en.cppreference.com/w/cpp/algorithm/accumulate): Computes the sum of elements in a range.
- [`std::reverse`](https://en.cppreference.com/w/cpp/algorithm/reverse): Reverses the order of elements in a range.
- [`std::unique`](https://en.cppreference.com/w/cpp/algorithm/unique): Removes consecutive duplicate elements in a range. Returns an iterator to the new logical end.
- [`std::count`](https://en.cppreference.com/w/cpp/algorithm/count): Counts the occurrences of a specific value in a range.
- [`std::count_if`](https://en.cppreference.com/w/cpp/algorithm/count_if): Counts the number of elements in a range that satisfy a given predicate.
- [`std::min_element`](https://en.cppreference.com/w/cpp/algorithm/min_element): Finds the smallest element in a range.
- [`std::max_element`](https://en.cppreference.com/w/cpp/algorithm/max_element): Finds the largest element in a range.
- [`std::distance`](https://en.cppreference.com/w/cpp/iterator/distance): Calculates the number of elements between two iterators.
- [`std::rotate`](https://en.cppreference.com/w/cpp/algorithm/rotate): Rotates the elements in a range such that a specified element becomes the first.
- [`std::shuffle`](https://en.cppreference.com/w/cpp/algorithm/random_shuffle): Randomly rearranges the elements in a range using a random number generator.
- [`std::fill`](https://en.cppreference.com/w/cpp/algorithm/fill): Assigns a specified value to all elements in a range.
- [`std::iota`](https://en.cppreference.com/w/cpp/algorithm/iota): Fills a range with sequentially increasing values starting from a given value.
- [`std::merge`](https://en.cppreference.com/w/cpp/algorithm/merge): Merges two sorted ranges into a single sorted range.
- [`std::copy`](https://en.cppreference.com/w/cpp/algorithm/copy): Copies elements from one range to another.

### Iterators

Allow traversal of elements in a container. They provide a way to access elements sequentially without exposing the underlying representation. Common types of iterators:

- [`std::begin`](https://en.cppreference.com/w/cpp/iterator/begin) and [`std::end`](https://en.cppreference.com/w/cpp/iterator/end): Used to obtain iterators pointing to the beginning and end of a container.
- [`std::advance`](https://en.cppreference.com/w/cpp/iterator/advance): Moves an iterator forward by a specified number of steps.

### Mathematical functions

- [`std::abs`](https://en.cppreference.com/w/cpp/numeric/math/abs): Returns the absolute value of a number.
- [`std::ceil`](https://en.cppreference.com/w/cpp/numeric/math/ceil): Rounds a number up to the nearest integer.
- [`std::floor`](https://en.cppreference.com/w/cpp/numeric/math/floor): Rounds a number down to the nearest integer.
- [`std::round`](https://en.cppreference.com/w/cpp/numeric/math/round): Rounds a number to the nearest integer.
- [`std::sqrt`](https://en.cppreference.com/w/cpp/numeric/math/sqrt): Computes the square root of a number.
- [`std::pow`](https://en.cppreference.com/w/cpp/numeric/math/pow): Raises a number to a specified power.
- [`std::log`](https://en.cppreference.com/w/cpp/numeric/math/log): Computes the natural logarithm of a number.
- [`std::log10`](https://en.cppreference.com/w/cpp/numeric/math/log10): Computes the base-10 logarithm of a number.
- [`std::sin`](https://en.cppreference.com/w/cpp/numeric/math/sin), [`std::cos`](https://en.cppreference.com/w/cpp/numeric/math/cos), [`std::tan`](https://en.cppreference.com/w/cpp/numeric/math/tan): Compute the sine, cosine, and tangent of an angle (in radians).
- [`std::asin`](https://en.cppreference.com/w/cpp/numeric/math/asin), [`std::acos`](https://en.cppreference.com/w/cpp/numeric/math/acos), [`std::atan`](https://en.cppreference.com/w/cpp/numeric/math/atan): Compute the arcsine, arccosine, and arctangent of a value.
- [`std::hypot`](https://en.cppreference.com/w/cpp/numeric/math/hypot): Computes the length of the hypotenuse of a right triangle given its two sides.
- [`std::exp`](https://en.cppreference.com/w/cpp/numeric/math/exp): Computes the exponential function \( e^x \).
- [`std::fmod`](https://en.cppreference.com/w/cpp/numeric/math/fmod): Computes the remainder of division of two floating-point numbers.
- [`std::gcd`](https://en.cppreference.com/w/cpp/numeric/gcd): Computes the greatest common divisor (GCD) of two integers.
- [`std::lcm`](https://en.cppreference.com/w/cpp/numeric/lcm): Computes the least common multiple (LCM) of two integers.

### Utilities

- [`std::function`](https://en.cppreference.com/w/cpp/utility/functional/function): Encapsulates callable objects like functions, lambdas, and functors.
- [`std::unique_ptr`](https://en.cppreference.com/w/cpp/memory/unique_ptr) and [`std::shared_ptr`](https://en.cppreference.com/w/cpp/memory/shared_ptr): Smart pointers for managing dynamic memory.

### Input/Output

- [`std::cin`](https://en.cppreference.com/w/cpp/io/cin) and [`std::cout`](https://en.cppreference.com/w/cpp/io/cout): Used for console input and output.
- [`std::fstream`](https://en.cppreference.com/w/cpp/io/basic_fstream): Used for file input and output.
