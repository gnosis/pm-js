#!/usr/bin/env node

const { spawn, execSync } = require('child_process');

const testrpc = spawn('testrpc', ['-l', '40000000'])
const cmd = process.argv.slice(2)
if(cmd.length !== 1)
    throw new Error(`Expected single argument but got ${cmd}!`)

new Promise((resolve, reject) => {
    testrpc.stdout.on('data', (data) => {
        if(data.includes('Listening on localhost:8545')) {
            resolve()
        }
    });

    let error = ''

    testrpc.stderr.on('data', (data) => {
        error += data
    })

    testrpc.on('close', (code) => {
        reject(new Error(`testrpc exited with code ${code} and the following error:\n\n${error}`));
    });

}).then(() => {
    execSync(cmd[0], { stdio: 'inherit' })
    return Promise.resolve()
}).then(() => {
    testrpc.kill()
    process.exit()
}).catch((err) => {
    testrpc.kill()
    throw err
})
