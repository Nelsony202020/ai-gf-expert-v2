import { loadDesktopHomepage } from '../src/lib/home/loadDesktopHomepage';

async function main() {
  const d = await loadDesktopHomepage();
  const candy = d.scoreExample.app;
  console.log('=== DATA QA ===');
  console.log('Latest featured:', d.featured?.title, d.featured?.date, d.featured?.href);
  console.log('Published review count:', d.publishedReviewCount);
  console.log('#1 winner:', d.winner.name, d.winner.overall.value, d.winner.slug);
  console.log('Score example:', candy.name, candy.overall.value, candy.slug);
  console.log(
    'Score example bars:',
    d.scoreExample.bars.map((b) => `${b.name} ${b.display} (${b.weight})`).join(' | '),
  );
  console.log(
    'Priority sample (images):',
    d.priorities.find((p) => p.id === 'images')?.winner.name,
    d.priorities.find((p) => p.id === 'images')?.winner.overall.value,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
