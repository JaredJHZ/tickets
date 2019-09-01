/* eslint-disable  func-names */
/* eslint-disable  no-console */


const Alexa = require('ask-sdk');
const fetch = require('node-fetch');
const LaunchRequest = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    let contestacion = "Bienvenido a tickets compucloud , ¿Qué desea realizar? Crear, Monitorear, listar tickets o Salir";
    let user = handlerInput.requestEnvelope.session.user.userId;
    let body = {
      'usuario':user
    }
    let logged = await fetch('https://2g9sugo8ab.execute-api.us-east-2.amazonaws.com/test/user', 
      {
        method:'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    ).then(data => data.json());

  

    if (logged){

      let token = logged;

      const attributes = handlerInput.attributesManager.getSessionAttributes();

      attributes.token = token;

      handlerInput.attributesManager.setSessionAttributes(attributes);

      return handlerInput.responseBuilder
      .speak(contestacion)
      .withShouldEndSession(false)
      .getResponse();
    } else {
      return handlerInput.responseBuilder
          .speak("Necesita identificarse en la skill! por favor diga . Registrar usuario")
          .withShouldEndSession(false)
          .getResponse();
    }

  },
};



const RegistrarUsuarioIntent = {
  
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "UserLogin"
      && handlerInput.requestEnvelope.request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  }
}

const CompletarRegistro = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'UserLogin'
    && handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
  },
  async handle(handlerInput) {
    let request = handlerInput.requestEnvelope.request;
    let usuario = request.intent.slots.user.value;
    let id = request.intent.slots.id.value;
    let alexaUser = handlerInput.requestEnvelope.session.user.userId;
    let body = {
      'usuario':usuario,
      'id':id,
      'alexaUser': alexaUser
    }
    let registrado = await fetch('https://2g9sugo8ab.execute-api.us-east-2.amazonaws.com/test/new', 
    {
      method:'post',
      body:    JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
    ).then(data => data.json());
    
    let mensaje;

    if (registrado) {
      mensaje = "Usuario registrado!";
    } else {
      mensaje = 'Error al registrar usuario';
    }
    
    return handlerInput.responseBuilder
      .speak(mensaje)
      .getResponse();
  },
};


const CrearTicket  = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'CrearTicket'
    && handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
  },
  async handle(handlerInput) {
    let request = handlerInput.requestEnvelope.request;

    const attributes = handlerInput.attributesManager.getSessionAttributes();

    let ticket = {
      'ticket': {
            'subject': request.intent.slots.tituloDelCaso.value,
            'comment': {
            'body': request.intent.slots.descripcionDelCaso.value
            },
            'priority':'urgent'
      }
    }

    let auth = `Bearer ${attributes.token}`;

    let creado = await fetch('https://jaredsoftwares.zendesk.com/api/v2/tickets.json', 
    {
      method:'post',
      body:    JSON.stringify(ticket),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': auth
      },
    }
    ).then(data => data.json());


    return handlerInput.responseBuilder
      .speak("Ticket creado!")
      .getResponse();
  }
}

const MostrarTicket = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'MostrarTicket'
    && handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
  } , 
  async handle(handlerInput) {
    let request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let auth = `Bearer ${attributes.token}`;
    let id = request.intent.slots.idTicket.value
    
    let ticket = await fetch(`https://jaredsoftwares.zendesk.com/api/v2/tickets/${id}.json`, 
    {
      method:'get',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': auth
      },
    }
    ).then(data => data.json());

  


    let contestacion = `El ticketd con id ${id} con asunto, ${ticket['ticket']['raw_subject']}, tiene un estado de ${ ticket['ticket']['status'] === 'open' ? 'abierto': 'cerrado'} `;

    return handlerInput.responseBuilder
      .speak(contestacion)
      .getResponse()

  }
}

const ListarTickets = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'ListarTickets';
  } , 
  async handle(handlerInput) {
    let request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let auth = `Bearer ${attributes.token}`;
    
    let data = await fetch(`https://jaredsoftwares.zendesk.com/api/v2/tickets.json`, 
    {
      method:'get',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': auth
      },
    }
    ).then(data => data.json());

    let tickets = data['tickets'];


    let contestacion = '';

    for(let ticket of tickets) {
      contestacion += `El ticketd con id ${ticket['id']} con asunto , ${ticket['raw_subject']}, tiene un estado de ${ ticket['status'] === 'open' ? 'abierto': 'cerrado'}.  `
      console.log(contestacion);
    }

    return handlerInput.responseBuilder
      .speak(contestacion)
      .getResponse()
  }
}




const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Tickets compucloud';
const GET_FACT_MESSAGE = 'Here\'s your fact: ';
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';


const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    RegistrarUsuarioIntent,
    CompletarRegistro,
    MostrarTicket,
    ListarTickets,
    CrearTicket,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();