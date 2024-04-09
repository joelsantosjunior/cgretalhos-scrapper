import http from 'https'
import { createWriteStream } from 'fs'
import axios from 'axios'

/**
 * It gets the content of a page and writes it to a file
 * 
 * @param {string} url 
 * @returns {Promise<void>}
 */
const getPageContent = async (url) => {

    const res = await axios({
        method: "GET",
        url,
        responseType: "stream"
    })

    const fileName = url.replace(/[^\w\s]/g, '-')

    return res.data.pipe(createWriteStream(`${fileName}.txt`))
}

export default getPageContent