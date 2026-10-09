<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import { BLOCK_LABELS, BLOCK_DESCRIPTIONS } from "../constants";
import type { ProductCategory } from "../types";
import {
  BLOCK_EXTRAPOLATIONS,
  MAIN_TEST_BLOCK_COUNT,
  type BlockExtrapolation,
} from "../utils/mainTestKilometers";
import { useNavigationStore } from "../stores/navigation";
import GlossaryLink from "./GlossaryLink.vue";
import GlossarySectionHeading from "./GlossarySectionHeading.vue";

const nav = useNavigationStore();

const BLOCK_HOURS: Record<number, number> = { 0: 35, 1: 37, 2: 31, 3: 37, 4: 30, 5: 37 };

const BLOCKS = Object.entries(BLOCK_LABELS).map(([k, label]) => ({
  index: Number(k),
  label,
  description: BLOCK_DESCRIPTIONS[Number(k)],
  hours: BLOCK_HOURS[Number(k)],
}));

/** Block 1 is always tested, so only blocks 2–6 can be extrapolated. */
const EXTRAPOLATED_BLOCKS = Array.from({ length: MAIN_TEST_BLOCK_COUNT - 1 }, (_, i) => i + 2);

function describeExtrapolation({ fromBlock, factor, offset }: BlockExtrapolation): string {
  let text = `Block ${fromBlock}`;
  if (factor !== undefined) text = `${factor} × ${text}`;
  if (offset !== undefined)
    text += ` ${offset < 0 ? "−" : "+"} ${Math.abs(offset * 100).toFixed(1)}%`;
  return text;
}

const EXTRAPOLATION_ROWS = Object.entries(BLOCK_EXTRAPOLATIONS).map(([category, rules]) => ({
  category: category as ProductCategory,
  cells: EXTRAPOLATED_BLOCKS.map((block) => {
    const rule = rules[block];
    return rule === undefined ? "—" : describeExtrapolation(rule);
  }),
}));

async function scrollToTarget() {
  const target = nav.glossaryTarget;
  if (!target) return;
  await nextTick();
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  nav.clearGlossaryTarget();
}

onMounted(scrollToTarget);
watch(() => nav.glossaryTarget, scrollToTarget);
</script>

<template>
  <div class="glossary">
    <h2 class="glossary-title">Glossary</h2>
    <p class="glossary-intro">Explanations of the terminology and methodology.</p>

    <section id="main-test" class="glossary-section">
      <GlossarySectionHeading section-id="main-test" heading="The Main Test" />
      <p>
        The Main Test consists of 6000 km of ride simulation to evaluate how well a lubricant
        protects the chain over extended use. The test machine is a Tacx Neo smart trainer set to
        250w resistance, driven by an industrial motor at 100 cadence - testing on a real bicylcle
        drive train. During the test, contamination and water is added at defined points. Throughout
        the test the chain is <strong>never cleaned</strong> — only re-lubricated at predetermined
        intervals — to simulate typical use where the lubricant accumulates grime over time. Up to
        30 re-lubrications are performed across all six blocks. Each block consists of approximately
        34.5 hours of ride simulation, totalling 207 hours for the full 6000 km test. The full test
        protocol is available
        <a
          href="https://zerofrictioncycling.com.au/wp-content/uploads/2025/01/ZFC-Test-protocol-Full-Brief-v3-Jan-25.pdf"
          target="_blank"
          rel="noopener noreferrer"
          >here</a
        >.
      </p>
      <p>
        <GlossaryLink section="chain-wear">Chain wear</GlossaryLink> is tracked at the end of each
        block. The test can end early if the chain is deemed too worn already, or if further testing
        would not provide useful insights (e.g. for private lubricants showing poor results early
        on).
      </p>
      <p>
        The test is divided into six sequential 1000 km
        <GlossaryLink section="main-test-blocks">blocks</GlossaryLink>.
      </p>
    </section>

    <section id="main-test-blocks" class="glossary-section">
      <GlossarySectionHeading section-id="main-test-blocks" heading="Main Test Blocks" />
      <p>
        The <GlossaryLink section="main-test">Main Test</GlossaryLink> is divided into six
        sequential 1000 km blocks:
      </p>
      <ul class="block-list">
        <li v-for="block in BLOCKS" :key="block.index">
          <strong>{{ block.label }}</strong> — {{ block.description }}
          <span class="block-duration">({{ block.hours }}h ride simulation)</span>
        </li>
      </ul>
      <p class="note">
        The blocks alternate between clean/dry conditions and contamination conditions, designed to
        test whether a lubricant can clear contamination and recover performance during clean
        blocks, and how well it protects under increasingly harsh contamination in the later blocks.
      </p>
      <strong>Extended Intervals/Double applications</strong>: For lubricants that are meant to be
      applied less frequently or more frequently than the standard re lubrication protocol provides,
      the note "Extended Intervals" or "Double applications" was added, and the amount of
      lubrication points reduced or doubled, respectively.
    </section>

    <section id="chain-wear" class="glossary-section">
      <GlossarySectionHeading section-id="chain-wear" heading="Chain Wear" />
      <p>
        Chain wear is expressed as a percentage of the standard replacement threshold. A chain is
        considered <strong>100% worn</strong> when it reaches 0.5% elongation — the
        industry-standard point at which a change of chain is recommended, since continued use will
        cause accelerated cassette and chainring wear, making full drivetrain replacement necessary.
      </p>
      <p>
        In the context of the <GlossaryLink section="main-test">Main Test</GlossaryLink>, the wear
        percentage shown per block reflects the wear accumulated during that specific 1000 km block
        only — not the cumulative total. The cumulative wear across all completed blocks determines
        whether a lubricant beats the test and feeds into the
        <GlossaryLink section="main-test-kilometers">Main Test Kilometers</GlossaryLink> score.
      </p>
    </section>

    <section id="main-test-kilometers" class="glossary-section">
      <GlossarySectionHeading section-id="main-test-kilometers" heading="Main Test Kilometers" />
      <p>
        The Main Test Kilometers is a single number that summarises a lubricant's performance in the
        <GlossaryLink section="main-test">Main Test</GlossaryLink>: Roughly,
        <em
          >how many kilometres of the Main Test does it take to fully
          <GlossaryLink section="chain-wear">wear</GlossaryLink> one chain?
        </em>
        Higher is better.
      </p>
      <p>
        It is the distance one chain would last if it were ridden through the full mix of conditions
        of all six blocks: 6000 km divided by the total chain wear across all six blocks.
      </p>
      <div class="formula-box">Main Test km = 6000 km ÷ (cumulative wear % after block 6)</div>

      <h4>Lubricant beats the test (chain survives all 6000 km)</h4>
      <p class="example">
        Example: A lubricant that wore the chain to only 50% over 6000 km would last twice as long,
        and is awarded <strong>12 000 km</strong>.
      </p>

      <h4>Test beats the lubricant (chain exceeds 100% wear during the test)</h4>
      <p>
        The same formula applies, so the result is based on the full mixed conditions, not only on
        how the chain performed in the early, easier blocks. The score can therefore be lower than
        the distance it actually took the chain to reach 100% wear.
      </p>
      <p class="example">
        Example: A lubricant reached 100% wear after 3000 km of mostly dry blocks, but performed
        poorly in the wet blocks and ended the test at 300% wear. Riding through all six blocks
        would have needed 3 chains, so the score is 6000 km ÷ 3 = <strong>2000 km</strong>.
      </p>

      <h4>Test stopped early (not all six blocks tested)</h4>
      <p>
        Tests are often stopped early, typically because the chain is already badly worn, or because
        further testing would not provide useful insights (e.g. for private lubricants showing poor
        results early on). The missing blocks are then extrapolated from the lubricant's own earlier
        blocks, using adjustments derived from the average results of lubricants of the same type
        that were physically tested in those blocks:
      </p>
      <div class="table-scroll">
        <table class="extrapolation-table">
          <thead>
            <tr>
              <th scope="col">Lubricant type</th>
              <th v-for="block in EXTRAPOLATED_BLOCKS" :key="block" scope="col">
                Block {{ block }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in EXTRAPOLATION_ROWS" :key="row.category">
              <th scope="row">{{ row.category }}</th>
              <td v-for="(cell, i) in row.cells" :key="i">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Percentages are added to (or subtracted from) the wear of the referenced block. Blocks
        without a rule above (marked "—"), and lubricants of other types, use the average wear of
        their tested blocks instead. Extrapolated blocks are likely optimistic: the lubricants used
        to derive them performed well enough to be tested further.
      </p>
      <p class="example">
        Example: A wet-drip lubricant wore the chain 22.3%, 30.9% and 45.1% in blocks 1–3 before the
        test was stopped. Block 4 is estimated as 30.9% + 26.1% = 57.0%, block 5 as 45.1% (same as
        block 3) and block 6 as 1.5 × 57.0% = 85.5%. The cumulative wear after block 6 is 285.9%, so
        the score is 6000 km ÷ 2.859 = <strong>2099 km</strong>.
      </p>
    </section>

    <section id="single-application-longevity" class="glossary-section">
      <GlossarySectionHeading
        section-id="single-application-longevity"
        heading="Single Application Longevity"
      />
      <p>
        The Single Application Longevity test measures how long a single application of lubricant
        protects the chain before the chain needs to be re-lubed or replaced. Unlike the
        <GlossaryLink section="main-test">Main Test</GlossaryLink>, the lubricant is applied once
        and the chain is tested until wear thresholds are reached — no re-lubrication is performed.
      </p>
      <p>The test is run under three riding conditions:</p>
      <ul class="condition-list">
        <li><strong>Dry Road Conditions</strong> — Clean, dry pavement. Best-case longevity.</li>
        <li>
          <strong>Dry Gravel / MTB / CX</strong> — Dry dirt and dust contamination, representative
          of off-road riding on dry trails.
        </li>
        <li>
          <strong>Extreme Conditions</strong> — Wet and muddy contamination. Most demanding
          real-world scenario.
        </li>
      </ul>
      <p>Two values are reported for each condition:</p>
      <ul class="metric-list">
        <li>
          <strong>Jump point</strong> — The distance (km) at which the
          <GlossaryLink section="chain-wear">wear</GlossaryLink> rate noticeably accelerates. This
          is the point at which the lubricant starts to break down and protection degrades rapidly.
          Re-lubrication before this point gives the best chain life.
        </li>
        <li>
          <strong>Wear allowance</strong> — The total distance (km) until the chain reaches 100%
          <GlossaryLink section="chain-wear">wear</GlossaryLink> and should be replaced.
        </li>
      </ul>
      <p>
        Higher values are better for both metrics. Note that the kilometers on a test machine should
        not be equated 1:1 with real world kilometers. Please lubricate your chain more often than
        indicated by the single application longevity test.
      </p>
    </section>

    <section id="lubricant-cost" class="glossary-section">
      <GlossarySectionHeading section-id="lubricant-cost" heading="Lubricant Cost" />
      <p>
        The lubricant cost shown is the total cost in Australian Dollars to run the full 6000 km
        <GlossaryLink section="main-test">Main Test</GlossaryLink>, based on the number of
        re-lubrication applications required and the cost per application.
      </p>
      <div class="formula-box">Lubricant cost = cost per unit × units used in Main Test</div>
      <p>
        This lets you compare the real-world running cost of different lubricants, accounting for
        both price and how frequently they need to be applied.
      </p>
    </section>

    <section id="cost-to-run" class="glossary-section">
      <GlossarySectionHeading section-id="cost-to-run" heading="Cost to Run" />
      <p>
        The cost to run a lubricant estimates the total expenditure per 1000 km, combining two
        components:
      </p>
      <ul class="metric-list">
        <li>
          <strong>Lubricant cost</strong> — the cost of the lubricant itself, based on how many
          applications were used during the
          <GlossaryLink section="main-test">Main Test</GlossaryLink> and the cost per package.
          <div class="formula-box">
            Lubricant cost per 1000 km = (cost per package × packages used in Main Test) ÷ 6
          </div>
        </li>
        <li>
          <strong>Drivetrain wear cost</strong> — the cost attributed to drivetrain wear. It is
          assumed you replace your drivetrain (see
          <GlossaryLink section="drive-train-cost">Drive Train Cost</GlossaryLink>) when you have
          worn through 2 chains. Each chain lasts
          <GlossaryLink section="main-test-kilometers">Main Test Kilometers</GlossaryLink>, so the
          full drivetrain cycle covers 2 × Main Test km.
          <div class="formula-box">
            Drivetrain wear cost per 1000 km = drivetrain cost ÷ (Main Test km × 2 ÷ 1000)
          </div>
        </li>
      </ul>
      <p class="example">
        Example: A lubricant costs $40 per bottle and requires 2 bottles over the Main Test,
        achieving a Main Test score of 6000 km. With a drivetrain cost of $500:<br />
        Lubricant cost = (40 × 2) ÷ 6 = <strong>$13/1000km</strong><br />
        Drivetrain wear cost = 500 ÷ (6000 × 2 ÷ 1000) = <strong>$42/1000km</strong><br />
        Total cost to run = <strong>$55/1000km</strong>
      </p>
      <p>
        The drivetrain cost can be adjusted using the slider on the Cost to Run tab to reflect your
        actual parts costs.
      </p>
    </section>

    <section id="drive-train-cost" class="glossary-section">
      <GlossarySectionHeading section-id="drive-train-cost" heading="Drive Train Cost" />
      <p>
        The drive train cost is the AUD cost of the components that need to be replaced due to chain
        wear: chain, cassette, and chain-rings (or cranks if individual chainring replacement is not
        possible on your setup).
      </p>
      <p>
        In practice, cassette and chain-rings typically outlast a single chain. A common rule of
        thumb is that you can replace the chain twice before the cassette and chain-rings are worn
        enough to require replacement. This means a full drivetrain replacement cycle consists of:
      </p>
      <ul class="metric-list">
        <li>2 × chain replacements</li>
        <li>1 × cassette replacement</li>
        <li>1 × chain-ring replacement (or crank replacement)</li>
      </ul>
      <p>
        The slider on the <strong>Cost to Run</strong> tab lets you enter the drivetrain cost that
        matches your own parts. A typical mid-range drivetrain (2 chains + cassette + chain-rings)
        might cost around $150–$600 AUD depending on component tier.
      </p>
    </section>
  </div>
</template>

<style scoped>
.glossary {
  max-width: 800px;
}

.glossary-title {
  font-size: 1.5rem;
  margin-bottom: 6px;
}

.glossary-intro {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 32px;
}

.glossary-section {
  border-top: 1px solid var(--border);
  padding-top: 28px;
  margin-bottom: 36px;
  scroll-margin-top: 16px;
}

.glossary-section h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-heading);
  margin: 20px 0 8px;
}

.glossary-section p {
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 10px;
}

.block-list,
.condition-list,
.metric-list {
  margin: 10px 0 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-list li,
.condition-list li,
.metric-list li {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text);
}

a {
  color: #3b82f6;
  text-decoration: underline;
}

a:hover {
  color: #60a5fa;
}

.block-duration {
  color: var(--text-muted);
  font-size: 0.85em;
}

.note {
  font-size: 0.85rem !important;
  color: var(--text-muted) !important;
  font-style: italic;
}

.formula-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 16px;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-heading);
  margin: 10px 0 16px;
}

.table-scroll {
  overflow-x: auto;
  margin: 10px 0 16px;
}

.extrapolation-table {
  border-collapse: collapse;
  font-size: 0.85rem;
  white-space: nowrap;
}

.extrapolation-table th,
.extrapolation-table td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
  color: var(--text);
}

.extrapolation-table thead th,
.extrapolation-table tbody th {
  color: var(--text-heading);
  font-weight: 600;
  background: var(--bg);
}

.extrapolation-table tbody th {
  text-transform: capitalize;
}

.example {
  background: var(--bg);
  border-left: 3px solid #3b82f6;
  padding: 8px 12px;
  border-radius: 0 4px 4px 0;
  font-size: 0.875rem !important;
  color: var(--text-muted) !important;
  margin: 8px 0 16px !important;
}
</style>
