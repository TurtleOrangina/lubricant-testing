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
import { useProductsStore } from "./stores/products";

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

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);

await useProductsStore(pinia).loadProducts();

app.mount("#lubricant-testing-app");
