import { readFile, readdir } from 'fs/promises';
import { load } from 'cheerio';
import { Readable } from 'stream';
import { createWriteStream } from 'fs';

async function parseToHtml(filePath) {
    const fileContent = await readFile(filePath, 'utf-8');
    const $ = load(fileContent);
    return $;
}

async function getPosts(fileName) {
    const $ = await parseToHtml(fileName);

    // Some clean up
    $('script').remove();
    $('.post-meta').remove();
    $('.blog-pager').remove();
    $('.footer-wrapper').remove();

    // Getting only the posts section
    return [$, $('div.blog-posts > .post')];
}

function mapPost($, post) {
    const title = $(post).find('.title').text().trim();
                
    const content = $(post).remove('.title').text().trim()
        .replace(/\n/g, '')
        .replace(/fullpost{display:none;}/g, ' ')

    const images = [];

    $(post).find('img').each((_, img) => {
        const src = $(img).attr('src');
        images.push(
            src?.replace(/\/\/(?=\d)/g, 'https://')
        );
    });

    const videos = [];

    $(post).find('object > embed').each((_, video) => {
        const src = $(video).attr('src');
        videos.push(
            src?.replace(/\/\/(?=www)/g, 'https://')
        );
    });

    const postData = {
        title,
        content,
        images,
        videos,
    };

    return postData;
}

function generatePostStream({ fileName }) {
    return new Readable({
        async read() {
            const [$, posts] = await getPosts(`files/text/${fileName}.txt`);
            
            posts.each((index, post) => {
                
                const postData = mapPost($, post)
                let dataString = JSON.stringify(postData)
    
                if (index === 0) {
                    dataString = `[${dataString},`
                }
    
                else if (index < posts.length - 1) {
                    dataString += ","
                }
    
                else if (index === posts.length - 1) {
                    dataString += "]"
                }
    
                this.push(dataString);
            });
    
            this.push(null);
        }
    });
}


const main = async (fileName) => {

    let files = [fileName]
    if (!fileName) {
        files = await readdir('files/text')
    }

    for (const file of files) {
        const fileName = file.replace('.txt', '');

        console.log('Processing: ', fileName)
        generatePostStream({ fileName })
            .pipe(createWriteStream(`files/json/${fileName.replace('https---', '')}.json`))
            .on('finish', () => console.log('Finished: ', fileName))
            .on('error', console.error);
    }
}

main().catch(console.error);