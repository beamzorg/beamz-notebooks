---
title: Getting Started
order: 1
---

# Getting Started with BEAMZ

BEAMZ is an electromagnetic simulation package for photonic chip designers using the FDTD method written in Jax. It features a high-level API for fast prototyping with just a few lines of code, an inverse design module for gradient-based optimization using the adjoint method with autodiff.

## Installation

We recommend using [uv](https://docs.astral.sh/uv/) but you can install BEAMZ using pip:

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

Here's a minimal example of a point source in 2D to get you started:

```python
import beamz as bz
import numpy as np

WL = 0.6 * µm # wavelength of the source
TIME = 25 * WL / bz.LIGHT_SPEED # total simulation duration
N_CLAD, N_CORE = 1, 2 # refractive indices of the core and cladding
DX, DT = bz.dxdt(WL, max(N_CORE, N_CLAD), dims=2, points_per_wavelength=8)

# Create the design
design = bz.Design(8*µm, 8*µm, material=Material(N_CLAD**2))
design += bz.Rectangle(width=4*µm, height=4*µm, material=Material(N_CORE**2))

# Define the signal and source
t = np.arange(0, TIME, DT)
signal = bz.ramped_cosine(
    t, 
    frequency=bz.LIGHT_SPEED/WL, 
    ramp_duration=3*WL/bz.LIGHT_SPEED, 
    t_max=TIME/2
)
source = bz.GaussianSource(position=(4*µm, 5*µm), width=WL/6, signal=signal)

# Define the simulation (with added PML boundaries)
sim = bz.Simulation(
    design=design, 
    devices=[source], 
    boundaries=[PML(edges='all', thickness=2*WL)], 
    time=time_steps, 
    resolution=DX)

# Run the simulation, interactively showing the $E_z$ field
sim.run(animate_live="Ez", animation_interval=1, clean_visualization=True)
```

<video controls width="100%">
  <source src="../assets/videos/dipole.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>


## Next Steps

- Check out the [Examples](/beamz-notebooks/) for interactive tutorials
- Join the community on [GitHub](https://github.com/quentinwach/beamz)
