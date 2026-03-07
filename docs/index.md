---
title: Getting Started
order: 1
---

# Getting Started with BEAMZ

BEAMZ is an open-source Python library for photonic simulation. It provides a simple, intuitive interface for designing and simulating photonic devices.

## Installation

Install BEAMZ using pip:

```bash
pip install beamz
```

Or install from source:

```bash
git clone https://github.com/quentinwach/beamz.git
cd beamz
pip install -e .
```

## Quick Start

Here's a minimal example to get you started:

```python
import beamz as bz

# Create a simple waveguide
wg = bz.Waveguide(width=0.5, length=10.0)

# Run a simulation
result = wg.simulate(wavelength=1.55)

# Plot the field
result.plot()
```

## Key Concepts

### Waveguides

Waveguides are the fundamental building blocks of photonic circuits. BEAMZ supports several waveguide types:

- **Strip waveguides** — high confinement, small footprint
- **Rib waveguides** — lower loss, easier fabrication
- **Slot waveguides** — enhanced light-matter interaction

### Simulation Modes

BEAMZ offers multiple simulation backends:

1. **Eigenmode solver** — for computing waveguide modes
2. **FDTD** — for full-wave time-domain simulations
3. **BPM** — beam propagation method for long structures

## Mathematical Background

The wave equation in a dielectric medium is given by:

$$\nabla^2 \mathbf{E} - \mu_0 \epsilon \frac{\partial^2 \mathbf{E}}{\partial t^2} = 0$$

For a waveguide with refractive index profile $n(x, y)$, the effective index $n_\text{eff}$ satisfies:

$$\beta = \frac{2\pi}{\lambda} n_\text{eff}$$

where $\beta$ is the propagation constant and $\lambda$ is the free-space wavelength.

## Next Steps

- Check out the [Examples](/beamz-notebooks/) for interactive tutorials
- Read the full API reference (coming soon)
- Join the community on [GitHub](https://github.com/quentinwach/beamz)
