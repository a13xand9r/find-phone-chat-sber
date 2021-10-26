import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import {
    createIntents,
    createMatchers,
    createSaluteRequest,
    createSaluteResponse,
    createScenarioWalker,
    createSystemScenario,
    createUserScenario,
    NLPRequest,
    NLPResponse,
    SaluteRequest
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { callPhoneHandler, changePhoneHandler, noMatchHandler, phoneHandler, runAppHandler, startHandler, wrongPhoneNumberHandler } from './handlers'
import model from './intents.json'
require('dotenv').config()

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent, match } = createMatchers<SaluteRequest, typeof intents>()

const userScenario = createUserScenario({
    Start: {
        match: () => false,
        handle: startHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.6}),
                handle: callPhoneHandler
            },
            No: {
                match: intent('/Нет', {confidence: 0.6}),
                handle: ({res}) => {
                    res.appendBubble('Хорошо, не буду')
                    res.setPronounceText('Хорошо, не буду')
                }
            }
        }
    },
    Phone: {
        match: req => req.message.normalized_text.includes('PHONE_NUMBER_TOKEN'),
        handle: phoneHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.6}),
                handle: callPhoneHandler
            },
            No: {
                match: intent('/Нет', {confidence: 0.6}),
                handle: wrongPhoneNumberHandler
            }
        }
    },
    ChangePhone: {
        match: intent('/Другой номер', {confidence: 0.4}),
        handle: changePhoneHandler
    }
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer(process.env.SMARTAPP_BRAIN_TOKEN),
    intents,
    systemScenario,
    userScenario
})

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)

    const sessionId = request.uuid.sub
    const session = await storage.resolve(sessionId)

    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}