import common from '../../lib/common/common.js'
import cfg from '../../lib/config/config.js'
import moment from 'moment'
import _ from 'lodash'

//基于骗赞

const DZ_ID = 1005281022 //点赞群号，不要改动此处.
const ver = 204
let Type_Url = 'https://raw.kkgithub.com/yeqiu6080/HotUpdate/refs/heads/main/example.json'
let Down_Url = 'https://raw.kkgithub.com/yeqiu6080/HotUpdate/refs/heads/main/example/自动点赞.js'
//更新
async function update() {
  try {
    console.log('[自动点赞][开始检查更新]')
    let code = (await (await fetch(Type_Url)).json()).zdz
    if (code > ver) {
      await common.downFile(Down_Url, './plugins/example/自动点赞.js')
      await common.relpyPrivate(cfg.masterQQ[0], '自动点赞更新完毕，记得重启哦.')
      console.log('[自动点赞][更新完成]')
    } else{
      console.log('[自动点赞][已是最新版本]')
  }
  } catch (err) {
    logger.error('「自动点赞检测更新失败」：' + err)
  }
  console.log('[自动点赞][检查更新完毕]')
}

update()

export class zdz extends plugin {
  constructor(e) {
    this.Redis_UP()
    this.task = {
      cron: Random_Time(),
      name: '自动点赞',
      fnc: () => this.Auto_Like()
    }
  }

  async PZ_Res(e, DO, HF, QQ, key) {
    if (!HF){
      return { Chook: '未开启点赞功能.', n: 0 }
    }
    let Chook, n = 0
    let Time = moment().add(1, 'days').startOf('day').unix()
    let new_date = Time - moment().unix()
    let Time2 = moment().format('HH:mm:ss')
    for (let i = 0; i < 10; i++) {
      try {
        let res = await new thumbUp(e).thumbUp(QQ, 20)
        if (res && res.code != 0) {
          if (res.code == 1) {
            Chook = `${DO}失败，请添加好友.`
            logger.error(`[骗赞失败][${QQ}][${Time2}赞失败.]`)
          } else {
            Chook = res.msg.replace(/给/g, DO).replace(/点/g, '').replace(/个赞/g, '下').replace(/点赞/g, '').replace(/。/g, '') + '.'
            await this.Redis_Set(key, new_date)
            console.log(`[赞成功][${QQ}][${Time2}赞成功.]`)
          }
          break
        }
      } catch (err) {
        if (err?.error?.message) {
          await this.Redis_Set(key, new_date)
          console.log(`[赞成功][${QQ}][${Time2}赞成功.]`)
          return { Chook: err.error.message + '.', n }
        } else {
          logger.error(`[赞失败][${QQ}][${Time2}赞失败.]`)
          return { Chook: '未知错误：' + err, n }
        }
      }
      n += 10
    }
    return { Chook, n }
  }

  async Auto_Like() {
    console.log('[自动点赞][任务开始执行]')
    let bots = [].concat(Bot.uin).map(uin => Bot[uin]).filter(bot => bot && !/^[a-zA-Z]+$/.test(bot.uin))
    for (let bot of bots) {
      if (!Array.from(bot.gl.keys()).map(Number).includes(DZ_ID)) {
        console.log(`「${bot.nickname || 'Bot'}(${bot.uin})」未加群.`)
        continue
      }
      const e = { adapter: bot.adapter, sendLike: bot.sendLike, bot }
      const List = Array.from(await (await bot.pickGroup(DZ_ID).getMemberMap()).values()).map(i => Number(i.user_id))
      for (let ID of List) {
        let key = `PZ&${bot.uin}&${ID}`
        if (await redis.get(key)) {
          Left_Time(ID, await redis.ttl(key))
          continue
        }
        try {
          await this.PZ_Res(e, '赞', true, ID, key)
          await common.sleep(_.sample([1000, 1500, 2000, 2500]))
        } catch (err) {
          logger.error(`「${bot.nickname || 'Bot'}(${bot.uin})&${ID}点赞出错：${err}」`)
        }
      }
    }
    console.log('[自动点赞][任务执行完毕]')
    await update()
  }
}

class thumbUp {
  constructor(e) {
    this.e = e
    this.Bot = e.bot ?? Bot
  }

  async thumbUp(uid, times = 1) {
    if (this.Bot?.sendLike && this.e.adapter?.red) return this.Bot.sendLike(uid, Math.min(times, 20))
    if (this.e?.adapter && ['shamrock', 'LagrangeCore'].includes(this.e.adapter)) return await this.L_S_PZ(uid, times)
    return await this.I_PZ(uid, times)
  }

  async L_S_PZ(uid, times) {
    try {
      let type = this.e.adapter
      if (type === 'LagrangeCore') {
        let tasks = Array.from({ length: times }, () => this.Bot.sendApi('send_like', { user_id: uid, times: 1 }))
        await Promise.all(tasks)
      } else await this.Bot.sendApi('send_like', { user_id: uid, times })
    } catch (err) {
      if (this.e.adapter !== 'LagrangeCore') {
        logger.error(err)
        return { code: 1, msg: '懒得喷.' }
      }
    }
    return { code: 0, msg: '懒得喷.' }
  }

  async I_PZ(uid, times) {
    let core = this.Bot.icqq?.core ?? this.Bot.core
    if (!core) try {
      core = (await import('icqq')).core
    } catch (error) {
      return await this.H_PZ(uid, times)
    }
    if (times > 20) times = 20
    let ReqFavorite = core.jce.encodeStruct([
      core.jce.encodeNested([
        this.Bot.uin, 1, this.Bot.sig.seq + 1, 1, 0, this.Bot.fl.get(uid) ? Buffer.from("0C180001060131160131", "hex") : Buffer.from("0C180001060131160135", "hex")
      ]),
      uid, 0, this.Bot.fl.get(uid) ? 1 : 5, times
    ])
    let body = core.jce.encodeWrapper({ ReqFavorite }, 'VisitorSvc', 'ReqFavorite', this.Bot.sig.seq + 1)
    let payload = await this.Bot.sendUni('VisitorSvc.ReqFavorite', body)
    let result = core.jce.decodeWrapper(payload)[0]
    return { code: result[3], msg: result[4] }
  }

  async H_PZ(uid, times) {
    let thumbUp = this.Bot.pickFriend(uid)?.thumbUp
    if (!thumbUp) throw new Error('当前适配器不支持点赞.')
    let res = await thumbUp(times)
    return { code: res.retcode || res.code, msg: res.message || res.msg }
  }
}

function Random_Time() {
  let S = _.random(0, 59)
  let M = _.random(0, 59)
  let H = _.random(2, 4)
  let cron = `${S} ${M} ${H} * * ?`
  console.log(`[自动点赞][任务将在${cron}开始]`)
  return cron
}

function Left_Time(ID, ttl) {
  let h = Math.floor(ttl / 3600), m = Math.floor((ttl % 3600) / 60), s = ttl % 60
  console.log(`[自动赞阻断][${ID}][自动赞CD][${h}:${m}:${s}]`)
}
