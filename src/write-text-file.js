import { Command } from "commander";
import * as cheerio from 'cheerio'
import getPageContent from "./requests/request-stream.js";

const program = new Command();

const baseUrl = 'https://cgretalhos.blogspot.com/'

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-s, --start <value>', '2022/11')
  .option('-e, --end <value>', '2023/11')
  .parse(process.argv);

const options = program.opts();

console.debug('start date:', `${options.start}`);
console.debug('end date:', `${options.end}`);

const [yearStart, monthStart] = options.start.split('/')

const [yearEnd, monthEnd] = options.end.split('/')

let currentYear = +yearStart

while (currentYear <= +yearEnd) {
    let currentMonth = +monthStart

    const monthCondition = currentYear === +yearEnd ? +monthEnd : 12

    while (currentMonth <= monthCondition) {
        const url = `${baseUrl}${currentYear}/${currentMonth.toString().padStart(2, '0')}`
        await getPageContent(url)
        currentMonth++
    }

    currentYear++
}




