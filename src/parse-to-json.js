import { readFile, readdir } from 'fs/promises'
import { load } from 'cheerio'
import { Readable } from 'stream'
import { createWriteStream } from 'fs'

async function parseToHtml(filePath) {
  const fileContent = await readFile(filePath, 'utf8')

  const $ = load(fileContent, { xmlMode: false })

  return $
}

async function getPosts(fileName) {
  const $ = await parseToHtml(fileName)

  // Some clean up
  $('.post-meta').remove()
  $('.blog-pager').remove()
  $('.footer-wrapper').remove()

  // Getting only the posts section
  return [$, $('div.blog-posts > .post')]
}

function mapPost($, post) {
  const [, publish_date] = $('.post-date', post)
    .html()
    .match(/var timestamp = "(.*?)";/)

  // It removes all <script> tags from the post
  $('script', post).remove()

  const title = $('.title', post).text().trim()

  const orignal_url = $('.title > h4 > a', post).attr('href')

  const content = $(post)
    .remove('script')
    .text()
    .trim()
    .replace(/\n/g, '')
    .replace(title, '')
    .replace(/fullpost{display:none;}/g, ' ')

  const images = []

  $(post)
    .find('img')
    .each((_, img) => {
      const src = $(img).attr('src')
      images.push(src?.replace(/\/\/(?=\d)/g, 'https://'))
    })

  const videos = []

  $(post)
    .find('object > embed')
    .each((_, video) => {
      const src = $(video).attr('src')
      videos.push(src?.replace(/\/\/(?=www)/g, 'https://'))
    })

  const postData = {
    title,
    content,
    images,
    videos,
    orignal_url,
    publish_date,
  }

  return postData
}

function generatePostStream({ fileName }) {
  return new Readable({
    async read() {
      const [$, posts] = await getPosts(`files/text/${fileName}.txt`)

      posts.each((index, post) => {
        const postData = mapPost($, post)
        let dataString = JSON.stringify(postData)

        if (index === 0) {
          dataString = `[${dataString}${posts.length > 1 ? ',' : ']'}`
        } else if (index < posts.length - 1) {
          dataString += ','
        } else if (index === posts.length - 1) {
          dataString += ']'
        }

        this.push(dataString)
      })

      this.push(null)
    },
  })
}

const main = async (fileName) => {
  let files = [fileName]
  if (!fileName) {
    files = await readdir('files/text')
  }

  for (const file of files) {
    const fileName = file.replace('.txt', '')

    console.log('Processing: ', fileName)
    generatePostStream({ fileName })
      .pipe(
        createWriteStream(
          `files/json/${fileName.replace('https---', '')}.json`,
        ),
      )
      .on('finish', () => console.log('Finished: ', fileName))
      .on('error', console.error)
  }
}

main().catch(console.error)
