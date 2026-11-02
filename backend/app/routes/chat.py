import os
import base64
import json
import logging
import urllib.request
import urllib.error

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.chat import ChatConversation, ChatMessage


router = APIRouter(prefix="/chat", tags=["AI Chat"])

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_HISTORY_MESSAGES = 20

SYSTEM_INSTRUCTIONS = """
You are DermaLytix AI, an intelligent and friendly AI assistant.

You help users understand:
- Skin health and dermatology
- Skincare routines and ingredients
- Acne, eczema, psoriasis and other skin conditions
- Human skin anatomy
- General education, science, programming and technology

IMPORTANT MEDICAL GUIDELINES:

1. Never claim that an image confirms a medical diagnosis.
2. Describe only visible features in uploaded images.
3. Explain possible causes as possibilities, not confirmed facts.
4. Explain general skincare practices in simple language.
5. Never prescribe medicines or dosages.
6. Do not recommend prescription treatments without a clinician.
7. Ask relevant follow-up questions when necessary:
   - How long has the concern been present?
   - Is there itching, pain, burning or swelling?
   - Is it spreading or changing?
   - Has the user tried any products?
8. Recommend a qualified dermatologist for persistent,
   worsening or concerning skin symptoms.
9. Recommend urgent medical attention for severe symptoms.
10. Never invent medical facts, test results or doctor availability.

RESPONSE FORMAT FOR SKIN IMAGE QUESTIONS:

1. What I can observe
2. Possible explanations
3. General care guidance
4. When to consult a dermatologist
5. Follow-up questions

For general questions, answer naturally and directly.

Be respectful, accurate, conversational and easy to understand.
"""


class MessageRequest(BaseModel):
    content: str = Field(default="", max_length=8000)
    image_data: str | None = Field(default=None, max_length=12000000)


class ConversationRequest(BaseModel):
    title: str = Field(default="New chat", max_length=200)


def get_owned_conversation(
    db: Session,
    conversation_id: int,
    user_id: int
):
    conversation = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id
        )
        .first()
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    return conversation


def ask_ollama(messages: list) -> str:
    ollama_url = os.getenv(
        "OLLAMA_URL",
        "http://127.0.0.1:11434/api/chat"
    )

    model_name = os.getenv(
        "OLLAMA_MODEL",
        "qwen2.5vl:3b"
    )

    payload = {
        "model": model_name,
        "messages": messages,
        "stream": False,
        "options": {
            "num_predict": 1200,
            "temperature": 0.4
        }
    }

    request = urllib.request.Request(
        ollama_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

        assistant_text = (
            result.get("message", {})
            .get("content", "")
            .strip()
        )

        if not assistant_text:
            raise HTTPException(
                status_code=502,
                detail="Ollama returned an empty response."
            )

        return assistant_text

    except urllib.error.HTTPError as exc:
        logger.error("Ollama HTTP error: %s", exc.code)

        raise HTTPException(
            status_code=502,
            detail=f"Ollama error {exc.code}. Check the model configuration."
        )

    except urllib.error.URLError:
        logger.exception("Could not connect to Ollama.")

        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure Ollama is running."
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unexpected Ollama error.")

        raise HTTPException(
            status_code=502,
            detail="Could not get a response from the local AI model."
        )


def decode_image(image_data: str) -> str:
    try:
        if not image_data.startswith("data:image/"):
            raise ValueError("Invalid image data.")

        header, encoded_image = image_data.split(",", 1)

        allowed_headers = {
            "data:image/jpeg;base64",
            "data:image/png;base64",
            "data:image/webp;base64"
        }

        if header.lower() not in allowed_headers:
            raise ValueError("Unsupported image format.")

        image_bytes = base64.b64decode(
            encoded_image,
            validate=True
        )

        if not image_bytes:
            raise ValueError("Empty image.")

        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Image too large.")

        return encoded_image

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Upload a valid JPEG, PNG or WEBP image under 8 MB."
        )


@router.post("/conversations")
def create_conversation(
    data: ConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conversation = ChatConversation(
            user_id=current_user.id,
            title=data.title.strip() or "New chat"
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        return {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not create chat conversation.")

        raise HTTPException(
            status_code=500,
            detail="Unable to create conversation."
        )


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == current_user.id)
        .order_by(desc(ChatConversation.updated_at))
        .all()
    )

    return [
        {
            "id": item.id,
            "title": item.title,
            "created_at": item.created_at,
            "updated_at": item.updated_at
        }
        for item in conversations
    ]


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_owned_conversation(
        db,
        conversation_id,
        current_user.id
    )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(
            ChatMessage.created_at.asc(),
            ChatMessage.id.asc()
        )
        .all()
    )

    return [
        {
            "id": item.id,
            "role": item.role,
            "content": item.content,
            "created_at": item.created_at
        }
        for item in messages
    ]


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    data: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = get_owned_conversation(
        db,
        conversation_id,
        current_user.id
    )

    user_text = data.content.strip()
    encoded_image = None

    if not user_text and not data.image_data:
        raise HTTPException(
            status_code=400,
            detail="Please enter a message or upload an image."
        )

    if data.image_data:
        encoded_image = decode_image(data.image_data)

    previous_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(
            desc(ChatMessage.created_at),
            desc(ChatMessage.id)
        )
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )

    previous_messages.reverse()

    model_messages = [
        {
            "role": "system",
            "content": SYSTEM_INSTRUCTIONS
        }
    ]

    for message in previous_messages:
        if message.role in ("user", "assistant"):
            model_messages.append({
                "role": message.role,
                "content": message.content
            })

    current_message = {
        "role": "user",
        "content": user_text or (
            "Please describe what you can observe in this image."
        )
    }

    if encoded_image:
        current_message["images"] = [encoded_image]

    model_messages.append(current_message)

    # Generate the AI response before saving the messages.
    assistant_text = ask_ollama(model_messages)

    try:
        saved_user_text = user_text or "[Image uploaded]"

        if data.image_data and user_text:
            saved_user_text += " [Image attached]"

        user_message = ChatMessage(
            conversation_id=conversation_id,
            role="user",
            content=saved_user_text
        )

        assistant_message = ChatMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_text
        )

        db.add_all([
            user_message,
            assistant_message
        ])

        if conversation.title == "New chat":
            conversation.title = (
                user_text[:60]
                if user_text
                else "Image conversation"
            )

        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save chat messages.")

        raise HTTPException(
            status_code=500,
            detail="Could not save the conversation."
        )

    return {
        "user_message": {
            "id": user_message.id,
            "role": user_message.role,
            "content": user_message.content,
            "created_at": user_message.created_at
        },
        "assistant_message": {
            "id": assistant_message.id,
            "role": assistant_message.role,
            "content": assistant_message.content,
            "created_at": assistant_message.created_at
        }
    }


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = get_owned_conversation(
        db,
        conversation_id,
        current_user.id
    )

    try:
        db.delete(conversation)
        db.commit()

        return {
            "message": "Conversation deleted successfully."
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not delete chat conversation.")

        raise HTTPException(
            status_code=500,
            detail="Unable to delete conversation."
        )