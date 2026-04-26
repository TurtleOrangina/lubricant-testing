import { createApp } from "vue";
import { createPinia } from "pinia";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  MarkAreaComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import "./style.css";
import App from "./App.vue";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  MarkAreaComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

createApp(App).use(createPinia()).mount("#app");
