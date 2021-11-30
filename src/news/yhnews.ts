import axios from 'axios'
import cheerio from 'cheerio'
import { Article, ArticleInfo } from '../types'
import { delay } from '../helpers/asyncUtils'

function request (url: string) {
  return axios.get<string>(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; + http://www.google.com/bot.html)'
    }
  })
}

export async function scrapPage (query: string, pageNo: number, from: string, to: string) {
  const data = await Promise.race([fetchArticleList(query, pageNo, from, to), delay(6000)])

  if (data === null) {
    throw new Error('Fetch articles failed')
  }

  const articleList = refineArticleInfoList(data)

  const result = await Promise.allSettled(articleList.map(article => scrapArticle(article, query)))
  const success = result.filter(x => x.status === 'fulfilled').map(x => (x as PromiseFulfilledResult<Article>).value)
  const failed = result.filter(x => x.status === 'rejected').map(x => (x as PromiseRejectedResult).reason as string)

  return {
    success,
    failed
  }
}

async function scrapArticle (articleInfo: ArticleInfo, query: string) {
  try {
    const data = await fetchArticle(articleInfo.articleId)
    const result: Article = {
      ...refineArticle(data),
      ...articleInfo,
      query
    }

    return result
  } catch (e) {
    throw articleInfo.articleId
  }
}

async function fetchArticleList (query: string, pageNo: number, from: string, to: string) {
  const url = encodeURI(`https://ars.yna.co.kr/api/v2/search.asis?query=${query}&period=diy&from=${from}&to=${to}&ctype=A&page_size=10&channel=basic_kr&page_no=${pageNo}`)
  const { data } = await request(url)
  return data
}

async function fetchArticle (articleId: string) {
  const url = `https://www.yna.co.kr/view/${articleId}`
  const { data } = await request(url)
  return data
}

function refineArticleInfoList (data: any): ArticleInfo[] {
  return (data.KR_ARTICLE.result as { CONTENTS_ID: string, TEXT_BODY: string }[]).map(item => ({
    articleId: item.CONTENTS_ID,
    description: item.TEXT_BODY
      .replace(/&quot;|ot;/g, '')
      .split('\n')
      .map(s => s.trim().replace(/(<([^>]+)>)/ig, ''))
      .filter(s => s)
      .join('\n')
  }))
}

function refineArticle (html: string) {
  const $ = cheerio.load(html)

  const title = $('#articleWrap > div > header > h1').text()
  const dateString = $('#articleWrap > div > header > p').contents().filter(function () {
    return this.type === 'text'
  }).text()
  const createdAt = new Date(dateString)

  let paragraphs: string[] = []
  $('#articleWrap > div > div > div > article > p')
    .each(function () {
      const paragraph = $(this).text()
      paragraphs.push(paragraph)
    })
  paragraphs = paragraphs.slice(0, -2)

  const keywords: string[] = []
  $('#articleWrap > div > div > div > div.keyword-zone > ul > li > a')
    .each(function () {
      const keyword = $(this).text()
      keywords.push(keyword)
    })

  let images: string[] = []
  $('#articleWrap > div > div > div > article img')
    .each(function () {
      const url = $(this).attr('src')?.slice(2) ?? null
      if (url !== null) {
        images.push(url)
      }
    })
  images = images.slice(1)

  return {
    paragraphs,
    images,
    keywords,
    title,
    createdAt
  }
}

