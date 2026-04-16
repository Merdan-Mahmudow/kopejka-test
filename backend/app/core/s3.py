from typing import List
import uuid
from fastapi import UploadFile
import aioboto3
from app.core.config import settings
from fastapi import HTTPException

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

async def upload_files_to_s3(files: List[UploadFile]) -> List[str]:
    if not files:
        return []

    # Validate file extensions
    for file in files:
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Недопустимый формат файла: .{ext}. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}")

    if not settings.SUPABASE_URL or not settings.AWS_ACCESS_KEY_ID:
        # Fallback if S3 is not configured
        return ["https://via.placeholder.com/600x400.png?text=No+S3+Configured" for _ in files]
        
    session = aioboto3.Session()
    uploaded_urls = []
    
    # Fix base url to point to Supabase objects via REST
    base_url = settings.SUPABASE_URL.replace("/s3", "")
    
    async with session.client(
        "s3",
        endpoint_url=settings.SUPABASE_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name="eu-central-1"  # Supabase Europe region
    ) as s3_client:
        for file in files:
            file_extension = file.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_extension}"
            
            await s3_client.upload_fileobj(
                file.file,
                settings.S3_BUCKET_NAME,
                file_name,
                ExtraArgs={"ContentType": file.content_type} # Supabase can set public ACL in bucket config
            )
            # Supabase public URL structure without the /s3 endpoint:
            url = f"{base_url}/object/public/{settings.S3_BUCKET_NAME}/{file_name}"
            uploaded_urls.append(url)
            
    return uploaded_urls
