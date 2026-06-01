const url = 'https://github.com/mohitdeshmukhdev/MST-SupplyChain/actions/runs/26721118341/job/78748250462';
fetch(url)
  .then(r => r.text())
  .then(t => {
    // let's grab all text between the "js-log-line-text" elements or just strip HTML
    // and print lines containing "error" or "failed" or "warning"
    const lines = t.replace(/<[^>]+>/g, '').split('\n').map(l => l.trim()).filter(l => l);
    const errors = lines.filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('fail') || l.toLowerCase().includes('warn') || l.toLowerCase().includes('npm err'));
    console.log(errors.slice(-100).join('\n'));
  }).catch(console.error);
