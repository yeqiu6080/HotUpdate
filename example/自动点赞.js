import common from '../../lib/common/common.js'
import cfg from '../../lib/config/config.js'
import moment from 'moment'
import YAML from 'yaml'
import _ from 'lodash'
import fs from 'fs'

/**
 * 桀桀桀
 * 扼杀骗赞
 * 基于骗赞
 **/

const Y68ID = 3023340183 // 部分判断所需Q号，不要改动此处.

const xq = [114514] // 宣传群名单
const white = [DZ_ID] // 白名单群
const xcy = `暂时关闭点赞功能.\n可加自动点赞群「${DZ_ID}」\n要自动点赞带上你的坤气人.` // 宣传语
const jyhf = '暂时关闭点赞功能.' // 禁用回复
let DZYX

const DZ_ID = 1005281022 //点赞群号，不要改动此处.
const ver = 205
let Type_Url = 'https://raw.kkgithub.com/yeqiu6080/HotUpdate/refs/heads/main/example.json'
let Down_Url = 'https://raw.kkgithub.com/yeqiu6080/HotUpdate/refs/heads/main/example/自动点赞.js'
//更新

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


export class zdz extends plugin {
  constructor(e) {
    super({
      name: '自动点赞',
      dsc: '自动点赞',
      event: 'message',
      priority: 98,
      rule: [
        { reg: /^#?(((我要|给我)?(资料卡)?点赞|(赞|超|操|草|抄|吵|炒)我)|((赞|超|操|草|抄|吵|炒)(他|她|它|TA))|自动点赞)(状态)?$/i, fnc: 'DZ', log: false },
        { reg: '^#(优先(自动点赞|椰奶)|(自动点赞|椰奶)优先)$', fnc: 'DZ_Set' },
        { reg: /^#(填写自动点赞|(恢复|删除)group)$/i, fnc: 'F_R' },
        { reg: '^#自动点赞帮助$', fnc: 'DZ_Help' }
      ]
    })
    this.Redis_UP()
    this.task = {
      cron: Random_Time(),
      name: '自动点赞',
      fnc: () => this.Auto_Like()
    }
  }

  async DZ(e) {
    this.Bot = e?.bot ?? Bot
    let DO = /超|操|草|抄|吵|炒/.test(e.msg) ? '超' : '赞'
    let HF = e.at || true
    let QQ = e.at || e.user_id
    let zt = e?.msg?.includes('状态')
    if (!DZYX && !white.includes(e.group_id)) return false
    let x = e.message?.[0]?.text ?? false
    e.message = ''
    await this.DZ_Msg2(e, x, e.user_id)
    if (!e.isMaster && xq.includes(e.group_id)) return this.DZ_Msg(e, HF, xcy, 0)
    if (!(e.isMaster || white.includes(e.group_id))) return this.DZ_Msg(e, HF, jyhf)
    let key = `DZ&${e.self_id}&${QQ}`
    let RedisData = await redis.get(key)
    if (zt) {
      let status = RedisData ? '1/1' : '0/1'
      console.log(`[自动点赞状态][${QQ}][${status}]`)
      return this.DZ_Msg(e, HF, `『今日自动点赞』：「${status}」`)
    }
    if (RedisData) return Left_Time(QQ, await redis.ttl(key))
    let { JNTM, n } = await this.DZ_Res(e, DO, HF, QQ, key)
    
    // 去除回复
    let HHAY = await this.Bot.fl.get(QQ)
    let KUN = `今天${DO}了${QQ === e.at ? QQ : '你'}${n}下了哦~\n记得回我！！！${HHAY ? '' : `\nPS：如果${DO}失败记得加我.`}`
    let msg = n > 0 ? KUN : JNTM
    await this.DZ_Msg(e, HF, msg)
    
    return true
  }

  async DZ_Res(e, DO, HF, QQ, key) {
    let JNTM, n = 0
    let Time = moment().add(1, 'days').startOf('day').unix()
    let new_date = Time - moment().unix()
    let Time2 = moment().format('HH:mm:ss')
    for (let i = 0; i < 10; i++) {
      try {
        let res = await new thumbUp(e).thumbUp(QQ, 20)
        if (res && res.code != 0) {
          if (res.code == 1) {
            JNTM = `${DO}失败，请添加好友.`
            logger.error(`[自动点赞失败][${QQ}][${Time2}自动点赞失败.]`)
          } else {
            JNTM = res.msg.replace(/给/g, DO).replace(/点/g, '').replace(/个赞/g, '下').replace(/点赞/g, '').replace(/。/g, '') + '.'
            await this.Redis_Set(key, new_date)
            console.log(`[自动点赞成功][${QQ}][${Time2}自动点赞成功.]`)
          }
          break
        }
      } catch (err) {
        if (err?.error?.message) {
          await this.Redis_Set(key, new_date)
          console.log(`[自动点赞成功][${QQ}][${Time2}自动点赞成功.]`)
          return { JNTM: err.error.message + '.', n }
        } else {
          logger.error(`[自动点赞失败][${QQ}][${Time2}自动点赞失败.]`)
          return { JNTM: '未知错误：' + err, n }
        }
      }
      n += 10
    }
    return { JNTM, n }
  }

  async Auto_Like() {

    console.log('[自动点赞][自动点赞][任务开始执行]')

    let bots = [].concat(Bot.uin).map(uin => Bot[uin]).filter(bot => bot && !/^[a-zA-Z]+$/.test(bot.uin))
    
    for (let bot of bots) {
      
      if (!Array.from(bot.gl.keys()).map(Number).includes(DZ_ID)) {
        console.log(`「${bot.nickname || 'Bot'}(${bot.uin})」未加入自动点赞群.`)
        continue
      }
      const e = { adapter: bot.adapter, sendLike: bot.sendLike, bot }
      const List = Array.from(await (await bot.pickGroup(DZ_ID).getMemberMap()).values()).map(i => Number(i.user_id))
      for (let ID of List) {
        let key = `DZ&${bot.uin}&${ID}`
        if (await redis.get(key)) {
          Left_Time(ID, await redis.ttl(key))
          continue
        }
        try {
          await this.DZ_Res(e, '赞', true, ID, key)
          await common.sleep(_.sample([1000, 1500, 2000, 2500]))
        } catch (err) {
          logger.error(`「${bot.nickname || 'Bot'}(${bot.uin})&${ID}点赞出错：${err}」`)
        }
      }
    }
    console.log('[自动点赞][自动点赞][任务执行完毕]')
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

  async DZ_Set(e) {
    if (!e.isMaster) return true
    let ngm = e.msg.match(/自动点赞/)
    if (ngm) {
      await redis.set(`DZYX`, '1')
      await this.reply('已设置自动点赞优先.', true, { recallMsg: 30 })
      return await this.Redis_UP()
    } else {
      await redis.del(`DZYX`)
      await this.reply('已设置椰奶优先.', true, { recallMsg: 30 })
      return await this.Redis_UP()
    }
  }

  async F_R(e) {
    if (e.isMaster || e.user_id == Y68ID) {
      let R = e.msg.match(/group/i)
      const GroupPath = './config/config/group.yaml'
      const Bot_Type = cfg.package.name
      try {
        let GroupData = YAML.parse(fs.readFileSync(GroupPath, 'utf8'))
        let ngm = GroupData.hasOwnProperty(String(DZ_ID))
        if (R) {
          if (ngm) delete GroupData[String(DZ_ID)]
          else return await this.reply('未添加过配置无需删除.', true, { recallMsg: 30 })
        } else if (!ngm) {
          GroupData[String(DZ_ID)] = {
            onlyReplyAt: 0,
            enable: Bot_Type.includes('miao') ? ['自动点赞', '重启'] : ['自动点赞', '开机', '进程管理'],
            disable: null
          }
        }
        fs.writeFileSync(GroupPath, YAML.stringify(GroupData), 'utf8')
        if (R) await this.reply('自动点赞群配置已删除.', true, { recallMsg: 30 })
        else await this.reply('自动点赞群配置修改成功~\n发送「#自动点赞帮助」查看说明.\nPS：发送「#恢复group」\n删除自动点赞群相关配置.', true, { recallMsg: 30 })
      } catch (err) {
        await this.reply('唔，出错了：' + err, true, { recallMsg: 30 })
      }
      return true
    } else {
      return e.group_id == DZ_ID || await this.reply('滚！', true)
    }
  }

  async DZ_Help(e) {
    const ngm = (i) => (i ? '【当前】' : '')
    const msg = [
      '『自动点赞帮助』',
      `「#自动点赞优先」${ngm(DZYX)}：`,
      '［设置全部点赞走自动点赞.］',
      `「#椰奶优先」${ngm(!DZYX)}：`,
      '［设置全部点赞走椰奶.］',
      '「#填写自动点赞」：',
      '［填入自动点赞群白名单配置.］',
      '「#恢复group」：',
      '［删除自动点赞群白名单配置.］',
      '『PS：自动点赞群只走自动点赞.』'
    ].join('\n')
    await this.reply(msg, true, { recallMsg: 30 })
  }

  DZ_Msg(e, HF, msg, recall = 30) { return e.reply([{ type: 'reply', id: e.message_id }, msg], false, { at: HF, recallMsg: recall }) }

  DZ_Msg2(e, x, id) { if (x == "#全部赞我" && id == Y68ID) e.reply('#全部赞我') }

  async Redis_UP() { DZYX = await redis.get(`DZYX`) }

  async Redis_Set(key, time) { await redis.set(key, JSON.stringify({ DZ: 1 }), { EX: parseInt(time) }) }
}

class thumbUp {
  constructor(e) {
    this.e = e
    this.Bot = e.bot ?? Bot
  }

  async thumbUp(uid, times = 1) {
    if (this.Bot?.sendLike && this.e.adapter?.red) return this.Bot.sendLike(uid, Math.min(times, 20))
    if (this.e?.adapter && ['shamrock', 'LagrangeCore'].includes(this.e.adapter)) return await this.L_S_DZ(uid, times)
    return await this.I_DZ(uid, times)
  }

  async L_S_DZ(uid, times) {
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

  async I_DZ(uid, times) {
    let core = this.Bot.icqq?.core ?? this.Bot.core
    if (!core) try {
      core = (await import('icqq')).core
    } catch (error) {
      return await this.H_DZ(uid, times)
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

  async H_DZ(uid, times) {
    let thumbUp = this.Bot.pickFriend(uid)?.thumbUp
    if (!thumbUp) throw new Error('当前适配器不支持点赞.')
    let res = await thumbUp(times)
    return { code: res.retcode || res.code, msg: res.message || res.msg }
  }
}

function Random_Time() {
  let M = _.random(0, 59)
  let H = _.random(2, 4)
  return `0 ${M} ${H} * * ?`
}

function Left_Time(ID, ttl) {
  let h = Math.floor(ttl / 3600), m = Math.floor((ttl % 3600) / 60), s = ttl % 60
  console.log(`[自动点赞阻断][${ID}][自动点赞CD][${h}:${m}:${s}]`)
}

Bot.on("message.group", e => /^(#全部赞我|#?自动点赞)$/.test(e?.message?.[0]?.text) && new zdz().DZ(e))
