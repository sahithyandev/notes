---
title: Strassen's Algorithm
sidebar:
  order: 8
slug: data-structures-and-algorithms/algorithms/strassens-algorithm
prev: true
next: true
---

An efficient algorithm for matrix multiplication that reduces the time complexity compared to the standard matrix multiplication method. The algorithm works by dividing each matrix into smaller submatrices and recursively performing multiplications and additions.

## Explanation

Suppose 2 $n \times n$ matrices $A$ and $B$ are given. $C = A \cdot B$ is to be calculated. $A$ and $B$ are broken into smaller square submatrices, and the multiplication is performed recursively.

1. Divide the matrices $A$ and $B$ into four $n/2 \times n/2$ submatrices:
  ```math
  A = \begin{bmatrix} A_{11} & A_{12} \\ A_{21} & A_{22} \end{bmatrix} \quad
  B = \begin{bmatrix} B_{11} & B_{12} \\ B_{21} & B_{22} \end{bmatrix}
  ```
2. Compute the following 7 products (Strassen's formulas):
   ```math
   \begin{aligned}[c]
   M_1 &= (A_{11} + A_{22})(B_{11} + B_{22})
   &
   M_5 &= (A_{11} + A_{12})B_{22} \\

   M_2 &= (A_{21} + A_{22})B_{11}
   &
   M_6 &= (A_{21} - A_{11})(B_{11} + B_{12}) \\

   M_3 &= A_{11}(B_{12} - B_{22})
   &
   M_7 &= (A_{12} - A_{22})(B_{21} + B_{22}) \\

   M_4 &= A_{22}(B_{21} - B_{11})
   & \\
   \end{aligned}
   ```
3. Combine the results to compute the submatrices of $C$:
   ```math
   \begin{aligned}
   C_{11} &= M_1 + M_4 - M_5 + M_7 \\
   C_{12} &= M_3 + M_5 \\
   C_{21} &= M_2 + M_4 \\
   C_{22} &= M_1 - M_2 + M_3 + M_6 \\
   \end{aligned}
   ```
4. Reconstruct the resulting matrix $C$:

```math
 C = \begin{bmatrix} C_{11} & C_{12} \\ C_{21} & C_{22} \end{bmatrix}
```

## Implementation

```cpp
#include <iostream>
#include <vector>
using namespace std;

typedef vector<vector<int>> Matrix;

Matrix add(const Matrix &A, const Matrix &B) {
    int n = A.size();
    Matrix result(n, vector<int>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            result[i][j] = A[i][j] + B[i][j];
    return result;
}

Matrix subtract(const Matrix &A, const Matrix &B) {
    int n = A.size();
    Matrix result(n, vector<int>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            result[i][j] = A[i][j] - B[i][j];
    return result;
}

Matrix strassen(const Matrix &A, const Matrix &B) {
    int n = A.size();
    if (n == 1) {
        return {{A[0][0] * B[0][0]}};
    }

    int newSize = n / 2;
    Matrix A11(newSize, vector<int>(newSize)), A12(newSize, vector<int>(newSize)),
           A21(newSize, vector<int>(newSize)), A22(newSize, vector<int>(newSize)),
           B11(newSize, vector<int>(newSize)), B12(newSize, vector<int>(newSize)),
           B21(newSize, vector<int>(newSize)), B22(newSize, vector<int>(newSize));

    for (int i = 0; i < newSize; ++i) {
        for (int j = 0; j < newSize; ++j) {
            A11[i][j] = A[i][j];
            A12[i][j] = A[i][j + newSize];
            A21[i][j] = A[i + newSize][j];
            A22[i][j] = A[i + newSize][j + newSize];

            B11[i][j] = B[i][j];
            B12[i][j] = B[i][j + newSize];
            B21[i][j] = B[i + newSize][j];
            B22[i][j] = B[i + newSize][j + newSize];
        }
    }

    Matrix M1 = strassen(add(A11, A22), add(B11, B22));
    Matrix M2 = strassen(add(A21, A22), B11);
    Matrix M3 = strassen(A11, subtract(B12, B22));
    Matrix M4 = strassen(A22, subtract(B21, B11));
    Matrix M5 = strassen(add(A11, A12), B22);
    Matrix M6 = strassen(subtract(A21, A11), add(B11, B12));
    Matrix M7 = strassen(subtract(A12, A22), add(B21, B22));

    Matrix C11 = add(subtract(add(M1, M4), M5), M7);
    Matrix C12 = add(M3, M5);
    Matrix C21 = add(M2, M4);
    Matrix C22 = add(subtract(add(M1, M3), M2), M6);

    Matrix C(n, vector<int>(n));
    for (int i = 0; i < newSize; ++i) {
        for (int j = 0; j < newSize; ++j) {
            C[i][j] = C11[i][j];
            C[i][j + newSize] = C12[i][j];
            C[i + newSize][j] = C21[i][j];
            C[i + newSize][j + newSize] = C22[i][j];
        }
    }

    return C;
}

int main() {
    Matrix A = {{1, 2}, {3, 4}};
    Matrix B = {{5, 6}, {7, 8}};
    Matrix C = strassen(A, B);

    for (const auto &row : C) {
        for (int val : row) {
            cout << val << " ";
        }
        cout << endl;
    }

    return 0;
}
```

### Time and Space Complexity

| Aspect                        | Standard Multiplication  | Strassen's Algorithm                        |
| ----------------------------- | ------------------------ | ------------------------------------------- |
| Time Complexity               | $O(n^3)$                 | $O(n^{\log_2 7}) \approx O(n^{2.81})$       |
| Space Complexity              | $O(n^2)$                 | $O(n^2 \log n)$ (due to recursion overhead) |
| Efficiency for Small Matrices | High (less overhead)     | Low (recursion overhead dominates)          |
| Efficiency for Large Matrices | Low (slower growth rate) | High (faster growth rate)                   |

Strassen's Algorithm is not always the best choice for small matrices due to the overhead of recursion and additional operations, but it is highly effective for large matrices.
