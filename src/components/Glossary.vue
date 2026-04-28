<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import { BLOCK_LABELS, BLOCK_DESCRIPTIONS } from "../constants";
import { useNavigationStore } from "../stores/navigation";
import GlossaryLink from "./GlossaryLink.vue";

const nav = useNavigationStore();

const BLOCKS = Object.entries(BLOCK_LABELS).map(([k, label]) => ({
  index: Number(k),
  label,
  description: BLOCK_DESCRIPTIONS[Number(k)],
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
      <h3>The Main Test</h3>
      <p>
        The Main Test consists of 6000 km of ride simulation to evaluate how well a lubricant
        protects the chain over extended use. The test machine is Tacx Neo smart trainer set to 250w
        resistance, driven by an industrial motor at 100 cadence - testing on a real bicylcle drive
        train. Throughout the test the chain is
        <strong>never cleaned</strong> — only re-lubricated at predetermined intervals — to simulate
        realistic long-distance riding where the lubricant accumulates grime over time. Up to 30
        re-lubrications are performed across all six blocks.
      </p>
      <p>
        <GlossaryLink section="chain-wear">Chain wear</GlossaryLink> is tracked at the end of each
        block. The test ends early if the chain reaches 100% wear before all blocks are complete, or
        if ZFC decides to stop (e.g. for private lubricants showing poor results early on).
      </p>
      <p>
        The test is divided into six sequential 1000 km
        <GlossaryLink section="main-test-blocks">blocks</GlossaryLink>.
      </p>
    </section>

    <section id="main-test-blocks" class="glossary-section">
      <h3>Main Test Blocks</h3>
      <p>
        The <GlossaryLink section="main-test">Main Test</GlossaryLink> is divided into six
        sequential 1000 km blocks:
      </p>
      <ol class="block-list">
        <li v-for="block in BLOCKS" :key="block.index">
          <strong>{{ block.label }}</strong> — {{ block.description }}
        </li>
      </ol>
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
      <h3>Chain Wear</h3>
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
      <h3>Main Test Kilometers</h3>
      <p>
        The Main Test Kilometers is a single number that summarises a lubricant's performance in the
        <GlossaryLink section="main-test">Main Test</GlossaryLink>: roughly,
        <em
          >how many kilometres of the Main Test does it take to fully
          <GlossaryLink section="chain-wear">wear</GlossaryLink> one chain?
        </em>
        Higher is better.
      </p>
      <p>The calculation depends on how the lubricant's test ended:</p>

      <h4>Lubricant beats the test (chain survives all 6000 km)</h4>
      <p>
        If the chain's cumulative wear is below 100% at the end of all six blocks, the result is
        extrapolated linearly. A lubricant that wore the chain to only 50% over 6000 km would last
        twice as long, and is awarded
        <strong>12 000 km</strong>.
      </p>
      <div class="formula-box">Main Test km = 6000 km ÷ (cumulative wear %)</div>

      <h4>Test beats the lubricant (chain reaches 100% wear during the test)</h4>
      <p>
        The lubricant scores 1000 km for completed block prior to reaching 100% cumulative chain
        wear. For the block in which the chain crossed 100% wear, it scores a proportional fraction
        of 1000 km based on how far into that block the failure would have occurred (assuming wear
        accumulates linearly within a block).
      </p>
      <p class="example">
        Example: Cumulative wear after block 3 is 90%. Block 4 adds another 40%, pushing the total
        to 130%. The chain would have reached 100% when 10% of remaining wear capacity was used up,
        which is 10/40 = 25% through block 4. Score: 3 × 1000 km + 0.25 × 1000 km =
        <strong>3250 km</strong>. Note that any further tested blocks would have no effect on the
        result, since the 100% wear allowance was reached already. Had the above lubriant been
        tested with annother 50% wear in block 5, this would have no effect.
      </p>

      <h4>Test stopped early (chain below 100% wear when test is aborted)</h4>
      <p>
        When a test is aborted before the chain reaches 100% wear — often because results are
        already known to be uncompetitive — the lubricant receives 1000 km for each completed block,
        plus an extrapolation for the next block based on the average wear rate seen so far.
      </p>
      <p class="example">
        Example: a lubricant wore the chain to 74% in block 1 and the test was stopped. The score is
        1000 km ÷ 0.74 = <strong>1351 km</strong>. This can be a slightly generous estimate, as it
        assumes the upcoming block would be as demanding as the blocks already completed — in
        reality, later blocks tend to be harder.
      </p>
    </section>

    <section id="single-application-longevity" class="glossary-section">
      <h3>Single Application Longevity</h3>
      <p>
        The Single Application Longevity test measures how long a single application of lubricant
        protects the chain before the chain needs to be re-lubed or replaced. Unlike the
        <GlossaryLink section="main-test">Main Test</GlossaryLink>, the lubricant is applied once
        and the chain is ridden until wear thresholds are reached — no re-lubrication is performed.
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
      <p>Higher values are better for both metrics.</p>
    </section>

    <section id="lubricant-cost" class="glossary-section">
      <h3>Lubricant Cost</h3>
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

.glossary-section h3 {
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: var(--text-heading);
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
