---
title: T Flip-flop
sidebar:
  order: 7
slug: computer-organization-and-digital-design/sequential-logic/t-flip-flop
prev: true
next: true
---

Aka. toggle flip-flop. Has no inputs. Toggles at a rising (or falling) clock
tick.

<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 356.01021474213417 185.27413761403523" height="200" class="mx-auto">
  <g stroke-linecap="round" transform="translate(106.82842707789428 54.365046704944234) rotate(0 71.81818181818176 60.454545454545496)"><path d="M0 0 C53.16 1.26, 108.51 2.81, 143.64 0 M0 0 C52.57 1.25, 105.87 -0.02, 143.64 0 M143.64 0 C143.81 42.21, 144.23 80.48, 143.64 120.91 M143.64 0 C142.9 28.03, 143.29 55.3, 143.64 120.91 M143.64 120.91 C91.38 121.36, 41.11 119.79, 0 120.91 M143.64 120.91 C113.9 122.54, 85.04 121.84, 0 120.91 M0 120.91 C-0.19 84.15, -1.74 52.85, 0 0 M0 120.91 C-0.58 87.34, -0.51 54.63, 0 0" stroke="currentColor" stroke-width="2" fill="none"></path></g><g stroke-linecap="round"><g transform="translate(53.37388162334878 84.81959215948973) rotate(0 25.121212121212125 0)"><path d="M0 0 C17.12 -1.33, 30.3 -0.97, 50.24 0 M0 0 C17.29 0.47, 33.4 0.53, 50.24 0" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(250.46479071425802 83.63777397767171) rotate(0 31.454545454545496 0)"><path d="M0 0 C15.47 0.62, 34.57 -0.98, 62.91 0 M0 0 C18.7 -0.86, 38.41 -1.15, 62.91 0" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(55.1011543506213 12.09231943221721) rotate(0 114.94942282468935 0)"><path d="M0 0 C73.16 1.68, 146.31 1.99, 229.9 0 M0 0 C91.09 -0.24, 180.9 0.4, 229.9 0" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(45.1011543506213 142.09231943221766) rotate(0 29.636363636363853 0)"><path d="M0 0 C20.19 1.58, 40.65 -1.03, 59.27 0 M0 0 C13.31 0.62, 27.42 -0.1, 59.27 0" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(253.19206344153054 140.91050125039965) rotate(0 29.636363636363853 0)"><path d="M0 0 C15.87 -1.67, 29.23 -0.94, 59.27 0 M0 0 C11.98 -0.7, 24.57 -0.32, 59.27 0" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g transform="translate(115.01024525971252 74.36504670494469) rotate(0 7.799995422363281 12.5)"><text x="0" y="17.619999999999997" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="currentColor" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">D</text></g><g transform="translate(114.5556998051668 130.6377739776717) rotate(0 12.329986572265625 12.5)"><text x="0" y="17.619999999999997" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="currentColor" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">En</text></g><g transform="translate(318.0102452597123 128.00141034130775) rotate(0 13.999984741210938 12.5)"><text x="0" y="17.619999999999997" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="currentColor" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">QN</text></g><g transform="translate(323.37388162334855 70.27413761403523) rotate(0 7.67999267578125 12.5)"><text x="0" y="17.619999999999997" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="currentColor" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Q</text></g><g transform="translate(10 129) rotate(0 13.869987487792969 12.5)"><text x="0" y="17.619999999999997" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="currentColor" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Clk</text></g><g stroke-linecap="round"><g transform="translate(53 84) rotate(0 0 -37)"><path d="M0 0 C-0.82 -25.19, -2.01 -51.9, 0 -74 M0 0 C-0.25 -26.28, 0.1 -52.8, 0 -74" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(285 140) rotate(0 0 -64.5)"><path d="M0 0 C1.72 -40.49, 2.39 -75.23, 0 -129 M0 0 C-0.74 -44.31, -1.9 -87.67, 0 -129" stroke="currentColor" stroke-width="2" fill="none"></path></g></g><mask></mask></svg>

## Characteristics

### Excitation table

Not required as there are no inputs.

## Implementation

### Using D Flip Flop

![T Flip Flop with D Flip Flop](./images/t-flip-flop/with-d.jpg)

### Using JK Flip Flop
![T Flip Flop with JK Flip Flop](./images/t-flip-flop/with-jk.jpg)

### Using D Flip Flop with Enable
![T Flip Flop with D Flip Flop and Enable](./images/t-flip-flop/with-d-enable.jpg)

### Using JK Flip Flop with Enable
![T Flip Flop with JK Flip Flop and Enable](./images/t-flip-flop/with-jk-enable.jpg)
