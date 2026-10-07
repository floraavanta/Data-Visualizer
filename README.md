# OmniMetrics

An interactive data visualization dashboard that turns raw data into charts across multiple analytical views. Paste or upload a dataset, and OmniMetrics detects its structure and lets you explore it with eight chart types and a custom chart builder.

**Live demo:** https://omnimetrics-interactive-data-visualization-studio.ai.studio
## What it does

OmniMetrics parses your data automatically (delimiters, headers, numeric columns, dates and categories) and updates every chart and KPI as you work. It comes with preset datasets so you can explore all the visual modes before importing your own.

## Features

### Data import and editing
- **Paste data:** use "Import Data" to paste CSV, TSV (copied directly from Excel or Google Sheets) or JSON. Delimiters, headers, numeric columns, dates and categories are detected automatically.
- **File upload:** drag and drop `.csv`, `.tsv` or `.json` files.
- **Inline cell editing:** in the Data Grid tab, click any cell to edit it. All charts and KPIs update instantly.
- **Preset datasets:** Enterprise Revenue, SaaS Cohorts and Marketing Funnels.

### Visualizations
- **Vertical bar and stacked bar:** categorical distributions as single, grouped or stacked bars.
- **Ranked horizontal bar:** ranked comparisons and top-performer lists.
- **Trend line and area chart:** smooth curves, multi-series support and hover crosshair tracking.
- **Interactive donut:** proportional share with interactive slices and a center callout.
- **Scatter and bubble plot:** two-variable correlation with regression trendlines and bubble sizing.
- **Radar / spider polygon:** multi-attribute profile benchmarking.
- **2D heatmap matrix:** density between any two categorical dimensions.
- **Conversion funnel:** stage drop-off and conversion waterfall.

### Custom chart visualizer
Choose the X-axis, Y-axis, aggregation (sum, average, count, min, max), group-by breakdown, sorting and color palette.

## Built with

- Google AI Studio (Build mode)
- [add frameworks from package.json, e.g. React, Vite]

## Run locally

1. Clone the repo
2. Install dependencies: `npm install`
3. If the repo has a `.env.example` file, copy it to `.env` and add any keys it asks for. Do not commit `.env`.
4. Start the app: `npm run dev`

## Author

Built by Umema Ali as a project for Google AI App Building.
