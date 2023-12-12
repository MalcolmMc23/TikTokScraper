import puppeteer from 'puppeteer-core'
import { config } from 'dotenv'
config()
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

        // html = await el.evaluate(e => e.innerHTML)

        const videoLinks = await page.evaluate(() => {
            const links = [];
            const videoElements = document.querySelectorAll('a[href^="https://www.tiktok.com/@catloverzclub/"]'); videoElements.forEach(el => {
                links.push(el.href);
            });
            return links;
        });

        console.log(videoLinks)
        // videoLinks.forEach((link, index) => {
        //     console.log(`${index + 1}: ${link}`);
        // });

        return html;
    } catch (error) {
        console.error("scrape failed", error);
    }
    finally {
        // closes the browser
        await browser?.close();
    }
}

scrape()
