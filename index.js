import puppeteer from 'puppeteer-core'
import { config } from 'dotenv'
config()
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import { JSDOM } from 'jsdom';

let userName = process.env.USER_NAME
let password = process.env.PASSWORD



async function scrape() {
    let browser;
    let url = "https://www.tiktok.com/@catloverzclub";
    let html;

    try {
        // Create a string 'auth' that concatenates 'userName' and 'password' with a colon in between
        const auth = `${userName}:${password}`
        // Connect to the browser using puppeteer and the WebSocket endpoint, passing in 'auth' for authentication
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`
        })

        // Create a new page in the browser
        const page = await browser.newPage()
        // Set the default navigation timeout for the page to 2 minutes
        page.setDefaultNavigationTimeout(2 * 60 * 1000)

        await page.goto(url)

        const selector = "body"

        await page.waitForSelector(selector)
        const el = await page.$(selector)
        html = await el.evaluate(e => e.innerHTML)

        // const videoLinks = extractLinks(html, "https://www.tiktok.com/@catloverzclub/")
        // console.log(html)

        console.log(videoLinks)

        const extractedArray = extractEveryThirdItem(videoLinks);
        console.log(extractedArray)


        // const videoLinks = await page.evaluate(() => {
        //     const links = [];
        //     const videoElements = document.querySelectorAll('a[href^="https://www.tiktok.com/@catloverzclub/"]');
        //     videoElements.forEach(el => {
        //         links.push(el.href);
        //     });
        //     return links;
        // });



        try {
            for (let i = 1; i < extractedArray.length; i++) {
                const data = await getDownloadLink(extractedArray[i]);
                await sleep(10000)
                console.log("just slept");
                const htmlString = data; // Your HTML string
                const downloadLink = extractHref(htmlString);
                const outputLocationPath = `./videos/video${i + 1}.mp4`
                downloadFile(downloadLink, outputLocationPath)
                    .then(() => console.log(`Downloaded file from ${downloadLink} to ${outputLocationPath}`))
                    .catch(error => console.error(`An error occurred: ${error}`));
            }
        } catch (error) {
            console.error('Failed to download video', error);
        }

        return html;
    } catch (error) {
        console.error("scrape failed", error);
    }
    finally {
        // closes the browser
        await browser?.close();
    }
}

function extractLinks(html, url) {
    // Parse the HTML string using jsdom
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Find all anchor tags that contain the specified URL
    console.log(html)
    const links = Array.from(doc.querySelectorAll(`a[href^="${url}"]`));

    // Return the href attributes of these links
    return links.map(link => link.href);
}

scrape()
function extractEveryThirdItem(array) {
    const result = [];
    for (let i = 2; i < array.length; i += 3) {
        result.push(array[i]);
    }
    return result;
}

// Example usage

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(fileUrl, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);

    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {

        // Ensure that the writer stream finishes
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    resolve(true);
                }
                // no need to call the reject here, as it will have been called in the
                // 'error' handler above if an error occurred.
            });
        });

    });
}



function extractHref(htmlString) {
    const regex = /<a href="(https:\/\/tikcdn\.io\/ssstik\/\d+)"[^>]*>Without watermark<\/a>/;
    const match = htmlString.match(regex);
    return match ? match[1] : null;
}

function getDownloadLink(link) {

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ssstik.io',
            path: '/abc?url=dl',
            method: 'POST',
            headers: {
                'authority': 'ssstik.io',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'dnt': '1',
                'hx-current-url': 'https://ssstik.io/en',
                'hx-request': 'true',
                'hx-target': 'target',
                'hx-trigger': '_gcaptcha_pt',
                'origin': 'https://ssstik.io',
                'referer': 'https://ssstik.io/en',
                'sec-ch-ua': '"Chromium";v="119", "Not?A_Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        };
        const req = https.request(options, function (res) {
            const chunks = [];

            res.on('data', function (chunk) {
                chunks.push(chunk);
            });

            res.on('end', function () {
                const body = Buffer.concat(chunks);
                // console.log(body.toString());
                resolve(body.toString());
            });
        });

        req.on('error', reject);

        // link = 'https://www.tiktok.com/@catloverzclub/video/7058036058352667909?is_from_webapp=1&sender_device=pc&web_id=729841573582615503'
        req.write(new URLSearchParams({
            'id': link,
            'locale': 'en',
            'tt': 'aTZWQUw2'
        }).toString());
        req.end();
    });


}

// let videoLinks = ['https://www.tiktok.com/@catloverzclub/video/7058036058352667909',
//     'https://www.tiktok.com/@catloverzclub/video/7058036058352667909',
//     'https://www.tiktok.com/@catloverzclub/video/7058036058352667909',
//     'https://www.tiktok.com/@catloverzclub/video/7044705668607134982',
//     'https://www.tiktok.com/@catloverzclub/video/7044705668607134982',
//     'https://www.tiktok.com/@catloverzclub/video/7044705668607134982',
//     'https://www.tiktok.com/@catloverzclub/video/7044704424069057797',
//     'https://www.tiktok.com/@catloverzclub/video/7044704424069057797',
//     'https://www.tiktok.com/@catloverzclub/video/7044704424069057797',
//     'https://www.tiktok.com/@catloverzclub/video/7043138158367722758',
//     'https://www.tiktok.com/@catloverzclub/video/7043138158367722758',
//     'https://www.tiktok.com/@catloverzclub/video/7043138158367722758',
//     'https://www.tiktok.com/@catloverzclub/video/7038684625576791301',
//     'https://www.tiktok.com/@catloverzclub/video/7038684625576791301',
//     'https://www.tiktok.com/@catloverzclub/video/7038684625576791301',
//     'https://www.tiktok.com/@catloverzclub/video/7038683660865883397',
//     'https://www.tiktok.com/@catloverzclub/video/7038683660865883397',
//     'https://www.tiktok.com/@catloverzclub/video/7038683660865883397',
//     'https://www.tiktok.com/@catloverzclub/video/7038683384587078918',
//     'https://www.tiktok.com/@catloverzclub/video/7038683384587078918',
//     'https://www.tiktok.com/@catloverzclub/video/7038683384587078918',
//     'https://www.tiktok.com/@catloverzclub/video/7036907469938937094',
//     'https://www.tiktok.com/@catloverzclub/video/7036907469938937094',
//     'https://www.tiktok.com/@catloverzclub/video/7036907469938937094',
//     'https://www.tiktok.com/@catloverzclub/video/7036907366994005253',
//     'https://www.tiktok.com/@catloverzclub/video/7036907366994005253',
//     'https://www.tiktok.com/@catloverzclub/video/7036907366994005253',
//     'https://www.tiktok.com/@catloverzclub/video/7036907235703819526',
//     'https://www.tiktok.com/@catloverzclub/video/7036907235703819526',
//     'https://www.tiktok.com/@catloverzclub/video/7036907235703819526',
//     'https://www.tiktok.com/@catloverzclub/video/7036907084235001093',
//     'https://www.tiktok.com/@catloverzclub/video/7036907084235001093',
//     'https://www.tiktok.com/@catloverzclub/video/7036907084235001093',
//     'https://www.tiktok.com/@catloverzclub/video/7036906984792165637',
//     'https://www.tiktok.com/@catloverzclub/video/7036906984792165637',
//     'https://www.tiktok.com/@catloverzclub/video/7036906984792165637',
//     'https://www.tiktok.com/@catloverzclub/video/7036906866932256006',
//     'https://www.tiktok.com/@catloverzclub/video/7036906866932256006',
//     'https://www.tiktok.com/@catloverzclub/video/7036906866932256006',
//     'https://www.tiktok.com/@catloverzclub/video/7036159194751339782',
//     'https://www.tiktok.com/@catloverzclub/video/7036159194751339782',
//     'https://www.tiktok.com/@catloverzclub/video/7036159194751339782',
//     'https://www.tiktok.com/@catloverzclub/video/7036158987481468166',
//     'https://www.tiktok.com/@catloverzclub/video/7036158987481468166',
//     'https://www.tiktok.com/@catloverzclub/video/7036158987481468166',
//     'https://www.tiktok.com/@catloverzclub/video/7036158721340247302',
//     'https://www.tiktok.com/@catloverzclub/video/7036158721340247302',
//     'https://www.tiktok.com/@catloverzclub/video/7036158721340247302',
//     'https://www.tiktok.com/@catloverzclub/video/7034297145360452869',
//     'https://www.tiktok.com/@catloverzclub/video/7034296755671829766',
//     'https://www.tiktok.com/@catloverzclub/video/7034296755671829766',
//     'https://www.tiktok.com/@catloverzclub/video/7034296755671829766',
//     'https://www.tiktok.com/@catloverzclub/video/7028678985076722949',
//     'https://www.tiktok.com/@catloverzclub/video/7028678985076722949',
//     'https://www.tiktok.com/@catloverzclub/video/7028678985076722949',
//     'https://www.tiktok.com/@catloverzclub/video/7028678870542880005',
//     'https://www.tiktok.com/@catloverzclub/video/7028678870542880005',
//     'https://www.tiktok.com/@catloverzclub/video/7028678870542880005',
//     'https://www.tiktok.com/@catloverzclub/video/7028678753274367237',
//     'https://www.tiktok.com/@catloverzclub/video/7028678753274367237',
//     'https://www.tiktok.com/@catloverzclub/video/7028678753274367237',
//     'https://www.tiktok.com/@catloverzclub/video/7028678602396912902',
//     'https://www.tiktok.com/@catloverzclub/video/7028678602396912902',
//     'https://www.tiktok.com/@catloverzclub/video/7028678602396912902',
//     'https://www.tiktok.com/@catloverzclub/video/7028678471463243014',
//     'https://www.tiktok.com/@catloverzclub/video/7028678471463243014',
//     'https://www.tiktok.com/@catloverzclub/video/7028678471463243014',
//     'https://www.tiktok.com/@catloverzclub/video/7028678190973324549',
//     'https://www.tiktok.com/@catloverzclub/video/7028678190973324549',
//     'https://www.tiktok.com/@catloverzclub/video/7028678190973324549',
//     'https://www.tiktok.com/@catloverzclub/video/7024263226493865222',
//     'https://www.tiktok.com/@catloverzclub/video/7024263226493865222',
//     'https://www.tiktok.com/@catloverzclub/video/7024263226493865222',
//     'https://www.tiktok.com/@catloverzclub/video/7024263094301887750',
//     'https://www.tiktok.com/@catloverzclub/video/7024263094301887750',
//     'https://www.tiktok.com/@catloverzclub/video/7024263094301887750',
//     'https://www.tiktok.com/@catloverzclub/video/7024262929763585286',
//     'https://www.tiktok.com/@catloverzclub/video/7024262929763585286',
//     'https://www.tiktok.com/@catloverzclub/video/7024262929763585286',
//     'https://www.tiktok.com/@catloverzclub/video/7024262775690071301',
//     'https://www.tiktok.com/@catloverzclub/video/7024262775690071301',
//     'https://www.tiktok.com/@catloverzclub/video/7024262775690071301',
//     'https://www.tiktok.com/@catloverzclub/video/7024262556114062597',
//     'https://www.tiktok.com/@catloverzclub/video/7024262556114062597',
//     'https://www.tiktok.com/@catloverzclub/video/7024262556114062597',
//     'https://www.tiktok.com/@catloverzclub/video/7021315006780165381',
//     'https://www.tiktok.com/@catloverzclub/video/7021315006780165381',
//     'https://www.tiktok.com/@catloverzclub/video/7021315006780165381',
//     'https://www.tiktok.com/@catloverzclub/video/7021314750617308422',
//     'https://www.tiktok.com/@catloverzclub/video/7021314750617308422',
//     'https://www.tiktok.com/@catloverzclub/video/7021314750617308422',
//     'https://www.tiktok.com/@catloverzclub/video/7021314626851704069',
//     'https://www.tiktok.com/@catloverzclub/video/7021314626851704069',
//     'https://www.tiktok.com/@catloverzclub/video/7021314626851704069',
//     'https://www.tiktok.com/@catloverzclub/video/7019747790393838854',
//     'https://www.tiktok.com/@catloverzclub/video/7019747790393838854',
//     'https://www.tiktok.com/@catloverzclub/video/7019747790393838854',
//     'https://www.tiktok.com/@catloverzclub/video/7019747604514737414',
//     'https://www.tiktok.com/@catloverzclub/video/7019747604514737414',
//     'https://www.tiktok.com/@catloverzclub/video/7019747604514737414',]