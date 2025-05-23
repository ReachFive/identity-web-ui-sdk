export interface windowSize {
    width: number;
    height: number;
}

export interface Provider {
    key: string;
    name: string;
    color: string;
    fontWeight?: number;
    fontFamily?: string;
    fontKey?: string;
    btnBorderColor?: string;
    btnTextColor?: string;
    btnBackgroundColor?: string;
    icon: string;
    windowSize?: windowSize;
    hidden?: boolean;
}

import { default as amazon } from './amazon/amazon';
import { default as apple } from './apple/apple';
import { default as bconnect } from './bconnect/bconnect';
import { default as facebook } from './facebook/facebook';
import { default as franceconnect } from './franceconnect/franceconnect';
import { default as google } from './google/google';
import { default as kakaotalk } from './kakaotalk/kakaotalk';
import { default as line } from './line/line';
import { default as linkedin } from './linkedin/linkedin';
import { default as mailru } from './mailru/mailru';
import { default as microsoft } from './microsoft/microsoft';
import { default as naver } from './naver/naver';
import { default as okta } from './okta/okta';
import { default as oney } from './oney/oney';
import { default as orange } from './orange/orange';
import { default as paypal } from './paypal/paypal';
import { default as ping } from './ping/ping';
import { default as qq } from './qq/qq';
import { default as tiktok } from './tiktok/tiktok';
import { default as twitter } from './twitter/twitter';
import { default as vkontakte } from './vkontakte/vkontakte';
import { default as wechat } from './wechat/wechat';
import { default as weibo } from './weibo/weibo';
import { default as yandex } from './yandex/yandex';

export const providers = {
    amazon: amazon,
    apple: apple,
    bconnect: bconnect,
    facebook: facebook,
    franceconnect: franceconnect,
    google: google,
    kakaotalk: kakaotalk,
    line: line,
    linkedin: linkedin,
    mailru: mailru,
    microsoft: microsoft,
    naver: naver,
    okta: okta,
    oney: oney,
    orange: orange,
    paypal: paypal,
    ping: ping,
    qq: qq,
    tiktok: tiktok,
    twitter: twitter,
    vkontakte: vkontakte,
    wechat: wechat,
    weibo: weibo,
    yandex: yandex,
};

export default providers;

export type ProviderId = keyof typeof providers;
