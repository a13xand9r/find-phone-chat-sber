import { SaluteHandler, SaluteRequest, SaluteResponse } from '@salutejs/scenario'
import * as dictionary from './system.i18n'
require('dotenv').config()

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN;   // Your Auth Token from www.twilio.com/console

const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
});

export const runAppHandler: SaluteHandler = ({ req, res }, dispatch) => {
    dispatch && dispatch(['Start'])
}

export const startHandler: SaluteHandler = ({ req, res, session }) => {
    console.log('session', session)

    const keyset = req.i18n(dictionary)
    let responseText: string

    if (session.phone){
        responseText = keyset('Привет с номером')
    } else{
        responseText = keyset('Привет')
    }

    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.setAutoListening(true)
    res.appendSuggestions(['Помощь', 'Выйти'])
}

export const noMatchHandler: SaluteHandler = async ({ req, res }) => {
    console.log(req.message.human_normalized_text)
    console.log(req.message.normalized_text)
    const keyset = req.i18n(dictionary)
    res.appendBubble(keyset('404'))
    res.setPronounceText(keyset('404'))
    res.appendSuggestions(['Поменять номер', 'Выйти'])
}

export const phoneHandler: SaluteHandler = ({ req, res, session }) => {
    console.log(req.message.human_normalized_text)
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Проверка телефона', {
        number: req.message.human_normalized_text
    })
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
    res.setAutoListening(true)

    session.phone = req.message.human_normalized_text
}

export const callPhoneHandler: SaluteHandler = ({ req, res, session }) => {
    console.log('session.phone', session.phone)
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Звонок', {
        number: session.phone as string
    })
    res.appendBubble(responseText)
    res.setPronounceText(responseText)

    console.log('accountSid',accountSid)
    console.log('authToken',authToken)
    console.log('client',client)
    client.calls.create({
        url: 'http://demo.twilio.com/docs/voice.xml',
        to: session.phone,
        from: '+12076905411'
    }, function(err: any, call: any){
        if (err) console.log(err)
        else console.log('call success, SID:', call.sid)
    })
}

export const wrongPhoneNumberHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Неверный номер')
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.setAutoListening(true)
}

export const changePhoneHandler: SaluteHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Новый номер')
    res.setPronounceText(responseText)
    res.appendBubble(responseText)
    res.setAutoListening(true)
}

