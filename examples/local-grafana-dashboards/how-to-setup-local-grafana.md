# Setting Up Local Grafana for HLS Monitor

This guide will help you set up a local Grafana instance with Prometheus for monitoring your HLS streams. The setup includes pre-configured dashboards and data sources.

## Prerequisites

- Docker and Docker Compose installed on your system
- The following files from this repository:
  - `grafana-docker-compose.yaml`
  - `prometheus.yml`
  - `demo-grafana-dashboard.json`

## Step-by-Step Setup

### 1. Start the Containers

First, stop any existing containers and start fresh:

```bash
docker-compose -f grafana-docker-compose.yaml down
docker-compose -f grafana-docker-compose.yaml up -d
```

This command will:
- Clear your terminal
- Stop and remove any existing containers
- Build and start new containers for Prometheus and Grafana

### 2. Verify Prometheus Setup

1. Open Prometheus in your browser: http://localhost:9090
2. Navigate to Status -> Targets
3. Verify that the `hls-monitor` target is showing as "UP"
   - If it's not UP, check that your HLS monitor application is running on port 3000
   - Verify the `prometheus.yml` configuration matches your setup

### 3. Configure Grafana

1. Open Grafana in your browser: http://localhost:3001
   - Default login is not required (anonymous access is enabled)

2. Add Prometheus Data Source:
   - Go to Configuration (⚙️) -> Data Sources
   - Click "Add data source"
   - Select "Prometheus"
   - Set URL to: `http://prometheus:9090`
   - Click "Save & Test"
   - You should see "Data source is working"

### 4. Import the Dashboard

1. In Grafana, go to Dashboards (four squares icon)
2. Click "Import"
3. Either:
   - Copy the contents of `demo-grafana-dashboard.json` and paste into the "Import via panel json" field
   - Or click "Upload JSON file" and select the `demo-grafana-dashboard.json` file
4. Click "Load"
5. Select your Prometheus data source in the dropdown
6. Click "Import"

### 5. Verify the Dashboard

Your dashboard should now be loaded and showing metrics from your HLS monitor. You should see:
- Monitor status indicators
- Error counts and distributions
- Stream health metrics
- Various other monitoring panels

If you don't see data:
- Verify your HLS monitor is running and generating metrics
- Check Prometheus targets are healthy
- Ensure the Prometheus data source is correctly configured in Grafana

## Troubleshooting

- If Prometheus can't reach your application, check that `host.docker.internal` is resolving correctly
- For Windows/macOS, the Docker compose file includes the necessary `extra_hosts` configuration
- Verify your HLS monitor application is exposing metrics on port 3000
- Check Docker logs for any error messages:
  ```bash
  docker-compose -f grafana-docker-compose.yaml logs
  ```

## Customizing the Dashboard

Feel free to modify the dashboard to suit your needs:
- Click the gear icon on any panel to edit it
- Add new panels using the "Add panel" button
- Save your changes using the save icon in the top bar

Remember that direct changes to the dashboard will be lost when containers are removed. To persist changes, export your modified dashboard JSON and save it to your project.