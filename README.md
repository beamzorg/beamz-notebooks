# BEAMZ Notebooks

A curated collection of interactive Jupyter notebooks for learning about optics, photonics, and laser physics.

**Live site:** [https://quentinwach.com/beamz-notebooks/](https://quentinwach.com/beamz-notebooks/)


## How Do I Contribute?

1. Fork this repository
2. Create a new branch and add your `.ipynb` file to the `notebooks/` directory
3. Include the metadata cell (cell 2) with at least your author name
4. Open a pull request against `main` for review
5. Once merged, the site auto-deploys via GitHub Actions


## Notebook Format

Each notebook should follow this structure:

### Cell 1 — Title & Description (markdown)

```markdown
# Your Notebook Title

A brief description of what this notebook demonstrates.
```

### Cell 2 — Metadata (markdown, optional)

```markdown
**Author:** Your Name
**Published:** 2025-01-15
**Updated:** 2025-02-01
**Tags:** Simulation, Optimization
```

All fields are optional. Tags are comma-separated and drive the homepage filter pills. If omitted, the author defaults to "Unknown", dates default to the file's modification time, and tags default to none.

You can also drag & drop a preview image into this cell as a Jupyter cell attachment:

```markdown
**Author:** Your Name
**Published:** 2025-01-15
**Tags:** Simulation, Visualization

![preview](attachment:preview.png)
```

If no preview image is attached, the build system automatically uses the first image output from any code cell.

This metadata cell is **not rendered** on the website — it's only used to populate the gallery card and notebook header.

### Remaining cells — Your content

Write your notebook as usual. The build system extracts the title, description, and category from the first cell, and generates syntax-highlighted code and rendered outputs for the site.