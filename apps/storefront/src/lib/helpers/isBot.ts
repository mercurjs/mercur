export default function isBot(ua: string) {
  return ua ? /bot|crawl|spider|slurp|bing|duckduckbot|GPTBot/i.test(ua) : true
}
