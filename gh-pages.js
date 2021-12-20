//https://www.devsamples.com/javascript/svelte/deploy-svelte-app-gh-pages
var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/spepechenn/spepechen.github.io.git', // Update to point to your repository  
        user: {
            name: 'spe', // update to use your name
            email: 'spepe.chen@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)