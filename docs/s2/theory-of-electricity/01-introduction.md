---
title: Introduction to Theory of Electricity
sidebar:
  label: Introduction
  order: 1
slug: theory-of-electricity/introduction
prev: false
next: true
---

Review these from [S1](https://s1.sahithyan.dev).

- [Charge](https://s1.sahithyan.dev/electrical-fundamentals/basics/introduction#charge)
- [Potential difference](https://s1.sahithyan.dev/electrical-fundamentals/basics/introduction#voltage)
- [Current](https://s1.sahithyan.dev/electrical-fundamentals/basics/introduction#current)
- [Power](https://s1.sahithyan.dev/electrical-fundamentals/basics/introduction#power)
- [Kirchoff's laws](https://s1.sahithyan.dev/electrical-fundamentals/basics/kirchoff-laws/)
- [Circuit elements](https://s1.sahithyan.dev/electrical-fundamentals/basics/circuit-elements/)
- [Resistors](https://s1.sahithyan.dev/electrical-fundamentals/basics/resistors/)
- [Capacitors](https://s1.sahithyan.dev/electrical-fundamentals/basics/capacitors/) -
  Voltage through a capacitor cannot change instantaneously
- [Inductors](https://s1.sahithyan.dev/electrical-fundamentals/basics/inductors/)-
  Current through an inductor cannot change instantaneously
- [Impedance & Admittance](https://s1.sahithyan.dev/electrical-fundamentals/basics/impedance-and-admittance/)
- [Active elements](https://s1.sahithyan.dev/electrical-fundamentals/basics/circuit-elements/#active)
- [AC Theory](https://s1.sahithyan.dev/electrical-fundamentals/basics/ac-theory)

## Types of active elements

<table>
	<tr>
		<th>Source</th>
		<th>Notation</th>
	</tr>
	<tr>
		<td>Current Source</td>
		<td>
			<svg direction="ltr" width="400" height="140"
				viewBox="647.0029231835972 342.2184717483765 506.43682673825356 181.56305650324714" stroke-linecap="round"
				stroke-linejoin="round" data-color-mode="light" class="tl-container tl-theme__force-sRGB tl-theme__light">
				<g transform="matrix(1, 0, 0, 1, 844.6487, 374.017)">
					<path
						d="M0,58.9829850495478 a58.9829850495478,58.9829850495478,0,1,1,117.9659700990956,0a58.9829850495478,58.9829850495478,0,1,1,-117.9659700990956,0 "
						stroke="currentColor" stroke-width="3.5" fill="none" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 521.4899, 434)">
					<path d="M 157.513,0 L164.513,0 L 319.9781,0 M 157.513,0 L164.513,-0.003 L 321.0799,-0.0692 "
						stroke="currentColor" stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 962.6132, 434.4785)">
					<path d="M 0,0 L7,0 L 158.8265,0 M 0,0 L7,-0.0154 L 159.9609,-0.3518 " stroke="currentColor"
						stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 850.8547, 433.5822)">
					<path
						d="M21.1677,-2.1416 Q24.7,-2.0393 28.504,-1.9652 T36.9271,-1.8373 46.573,-1.7445 56.6264,-1.6773 66.2722,-1.6285 74.6953,-1.5932 81.0806,-1.5676 84.6129,-1.6186 85.8322,-1.6365 86.3407,-1.4651 86.7679,-1.1404 87.069,-0.6963 87.2125,-0.1792 87.1834,0.3566 86.9848,0.8551 86.6374,1.264 86.1776,1.5406 85.6535,1.6559 85.1201,1.5978 84.6331,1.3725 84.2436,1.0034 83.9923,0.5293 83.9055,-0.0002 83.9924,-0.5298 84.2439,-1.0038 84.6335,-1.3728 85.1205,-1.598 85.654,-1.6559 86.178,-1.5404 86.6377,-1.2637 86.985,-0.8546 87.1835,-0.3561 87.2125,0.1797 87.0688,0.6967 86.7675,1.1408 86.3402,1.4654 85.8317,1.6366 85.5636,1.6805 84.6129,1.6186 81.0806,1.5676 74.6953,1.5932 66.2722,1.6285 56.6264,1.6773 46.573,1.7445 36.9271,1.8373 28.504,1.9652 21.1677,2.1416 17.2061,2.1585 16.4127,1.8299 15.8055,1.2226 15.4769,0.4293 15.477,-0.4295 15.8057,-1.2228 16.4129,-1.83 17.2063,-2.1585 17.6356,-2.2439 21.1677,-2.1416 Z"
						stroke-width="1" stroke="currentColor" fill="currentColor" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 936.9059, 433.7452)">
					<path
						d="M-4.6089,-1.705 Q-7.7035,-4.9243 -9.646,-6.9573 T-13.7188,-11.1861 -17.9884,-15.5689 -22.0982,-19.7607 -25.7074,-23.4008 -28.8784,-26.5438 -30.5681,-28.2707 -30.8048,-28.7479 -30.8767,-29.2757 -30.7763,-29.7988 -30.5141,-30.2625 -30.1176,-30.6182 -29.6283,-30.8287 -29.0974,-30.8719 -28.5804,-30.7433 -28.1317,-30.4564 -27.798,-30.0411 -27.6143,-29.5411 -27.6,-29.0086 -27.7564,-28.4995 -28.0672,-28.0669 -28.4999,-27.7562 -29.0091,-27.5999 -29.5416,-27.6144 -30.0416,-27.7982 -30.4567,-28.132 -30.7435,-28.5809 -30.8719,-29.0979 -30.8286,-29.6288 -30.618,-30.118 -30.2621,-30.5144 -29.7984,-30.7765 -29.2752,-30.8767 -28.7474,-30.8047 -28.2703,-30.5679 -28.0513,-30.4105 -26.5438,-28.8784 -23.4008,-25.7074 -19.7607,-22.0982 -15.5689,-17.9884 -11.1861,-13.7188 -6.9573,-9.646 -1.705,-4.6089 1.7465,-1.1669 2.0601,-0.4097 2.0601,0.4098 1.7464,1.167 1.1669,1.7465 0.4096,2.0601 -0.4099,2.0601 -1.1671,1.7464 -1.5144,1.5143 -4.6089,-1.705 Z"
						stroke-width="1" stroke="currentColor" fill="currentColor" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 936.3899, 434.0892)">
					<path
						d="M-1.4301,4.3341 Q-4.3746,7.1538 -6.2345,8.9232 T-10.1019,12.6346 -14.108,16.5275 -17.9384,20.2759 -21.2498,23.5826 -24.0973,26.4994 -25.692,28.0698 -26.1859,28.3147 -26.7322,28.3892 -27.2736,28.2852 -27.7535,28.0139 -28.1216,27.6035 -28.3394,27.0971 -28.3842,26.5476 -28.2511,26.0126 -27.9541,25.5481 -27.5244,25.2027 -27.0069,25.0127 -26.4557,24.9978 -25.9287,25.1597 -25.481,25.4814 -25.1595,25.9292 -24.9977,26.4562 -25.0128,27.0074 -25.203,27.5248 -25.5484,27.9544 -26.013,28.2513 -26.5481,28.3842 -27.0976,28.3393 -27.6039,28.1213 -28.0142,27.7531 -28.2854,27.2731 -28.3892,26.7316 -28.3146,26.1854 -28.0695,25.6916 -27.9066,25.4649 -26.4994,24.0973 -23.5826,21.2498 -20.2759,17.9384 -16.5275,14.108 -12.6346,10.1019 -8.9232,6.2345 -4.3341,1.4301 -1.1669,-1.7465 -0.4097,-2.0601 0.4098,-2.0601 1.167,-1.7464 1.7465,-1.1669 2.0601,-0.4096 2.0601,0.4099 1.7464,1.1671 1.5143,1.5144 -1.4301,4.3341 Z"
						stroke-width="1" stroke="currentColor" fill="currentColor" transform="scale(1)" />
				</g>
			</svg>
		</td>
	</tr>
	<tr>
		<td>DC Voltage Source</td>
		<td>
			<svg direction="ltr" width="400" height="140"
				viewBox="647.0029231835972 342.2184717483765 506.43682673825356 181.56305650324714" stroke-linecap="round"
				stroke-linejoin="round" data-color-mode="light" class="tl-container tl-theme__force-sRGB tl-theme__light">
				<g transform="matrix(1, 0, 0, 1, 844.6487, 374.017)">
					<path
						d="M0,58.9829850495478 a58.9829850495478,58.9829850495478,0,1,1,117.9659700990956,0a58.9829850495478,58.9829850495478,0,1,1,-117.9659700990956,0 "
						stroke="currentColor" stroke-width="3.5" fill="none" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 521.4899, 434)">
					<path d="M 157.513,0 L164.513,0 L 319.9781,0 M 157.513,0 L164.513,-0.003 L 321.0799,-0.0692 "
						stroke="currentColor" stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 962.6132, 434.4785)">
					<path d="M 0,0 L7,0 L 158.8265,0 M 0,0 L7,-0.0154 L 159.9609,-0.3518 " stroke="currentColor"
						stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 929.447, 401.9562)"><text font-size="44" font-family="'tldraw_mono', monospace"
						font-style="normal" font-weight="normal" dominant-baseline="mathematical" alignment-baseline="mathematical"
						stroke="rgb(249, 250, 251)" stroke-width="2" fill="rgb(249, 250, 251)">
						<tspan alignment-baseline="mathematical" x="0" y="22.699996948242188" unicode-bidi="plaintext">+</tspan>
					</text><text font-size="44" font-family="'tldraw_mono', monospace" font-style="normal" font-weight="normal"
						dominant-baseline="mathematical" alignment-baseline="mathematical" fill="currentColor">
						<tspan alignment-baseline="mathematical" x="0" y="22.699996948242188" unicode-bidi="plaintext">+</tspan>
					</text></g>
				<g transform="matrix(1, 0, 0, 1, 860, 402.8821)"><text font-size="44" font-family="'tldraw_mono', monospace"
						font-style="normal" font-weight="normal" dominant-baseline="mathematical" alignment-baseline="mathematical"
						stroke="rgb(249, 250, 251)" stroke-width="2" fill="rgb(249, 250, 251)">
						<tspan alignment-baseline="mathematical" x="0" y="22.699996948242188" unicode-bidi="plaintext">-</tspan>
					</text><text font-size="44" font-family="'tldraw_mono', monospace" font-style="normal" font-weight="normal"
						dominant-baseline="mathematical" alignment-baseline="mathematical" fill="currentColor">
						<tspan alignment-baseline="mathematical" x="0" y="22.699996948242188" unicode-bidi="plaintext">-</tspan>
					</text></g>
			</svg>
		</td>
	</tr>
	<tr>
		<td>AC Voltage Source</td>
		<td>
			<svg direction="ltr" width="400" height="140"
				viewBox="647.0029231835972 342.2184717483765 506.43682673825356 181.56305650324714" stroke-linecap="round"
				stroke-linejoin="round" data-color-mode="light" class="tl-container tl-theme__force-sRGB tl-theme__light">
				<defs />
				<g transform="matrix(1, 0, 0, 1, 844.6487, 374.017)">
					<path
						d="M0,58.9829850495478 a58.9829850495478,58.9829850495478,0,1,1,117.9659700990956,0a58.9829850495478,58.9829850495478,0,1,1,-117.9659700990956,0 "
						stroke="currentColor" stroke-width="3.5" fill="none" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 521.4899, 434)">
					<path d="M 157.513,0 L164.513,0 L 319.9781,0 M 157.513,0 L164.513,-0.003 L 321.0799,-0.0692 "
						stroke="currentColor" stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 962.6132, 434.4785)">
					<path d="M 0,0 L7,0 L 158.8265,0 M 0,0 L7,-0.0154 L 159.9609,-0.3518 " stroke="currentColor"
						stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
				<g transform="matrix(1, 0, 0, 1, 871.4334, 435.757)">
					<path
						d="M 0,0 L4.6727,5.2121 L 19.9204,22.2203 Q 24.5931,27.4324 27.5163,21.072 L 46.2631,-19.7185 Q 49.1862,-26.0789 52.5571,-19.944 L 63.5155,0 M 0,0 L4.4568,5.3979 L 19.1283,23.1674 Q 23.5851,28.5653 26.4458,22.1765 L 45.218,-19.7479 Q 48.0786,-26.1366 51.6893,-20.1397 L 63.8899,0.124 "
						stroke="currentColor" stroke-width="3.5" fill="none" transform="scale(1)" />
				</g>
			</svg>
		</td>
	</tr>
</table>

### Independent source

The terminal voltage or current depends only on the loading & internal source
quantity.

### Dependent source

The terminal voltage or current depends on another circuit quantity such as a
voltage or current. Categorized into 4.

- Voltage-controlled voltage source
- Voltage-controlled current source
- Current-controlled voltage source
- Current-controlled current source

Dependent sources are denoted with the relationship with another independent
source.

## Waveform errors

### DC Offset

A DC voltage superimposed on a AC waveform shifts it up or down. Causes unwanted
clipping of the AC voltage when amplification. Causes the waveform to have
reduced dynamic range, reduced headroom, increases noise when amplified and
causes problems with DC-coupled circuits.

- Dynamic Range: Refers to the ratio between the largest and smallest signal levels it can handle effectively. Expressed in decibels (dB).

- Headroom: Difference between the nominal operating level of a system and its maximum level before distortion occurs. It provides a safety margin to accommodate unexpected peaks in the signal without causing clipping or distortion. Adequate headroom ensures the integrity of the signal during amplification or processing.

- Nominal Operating Level: Refers to the standard or reference level at which a system is designed to operate optimally.

- Noise: Refers to any unwanted electrical signals or disturbances that interfere with the desired signal. It can be from thermal noise, electromagnetic interference, or circuit imperfections. Reduces the clarity and quality of the signal.

### Moving iron instrument

Can be identified by AC symbol. Measures the rms value of the signal.

### Moving coil instrument

Can be identified by DC symbol. Measures the average value of the signal.

### Moving coil rectifier instrument

Can be identified by diode symbol. Measures the rms value of the rectified
signal. Full wave rectifier bridge of 4 diodes is used. Assuming the current is
sinusoidal, the scale of this instrument must be marked in terms of 1.11 times
the current.

```math
\frac{\text{rms value of sine wave}}{\text{average value of sine wave}} = 1.11
```
