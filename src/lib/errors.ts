import { NextResponse } from 'next/server'

export class APIError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message)
        this.name = 'APIError'
    }
}

export function handleError(error: unknown) {
    console.error('API Error:', error)

    if (error instanceof APIError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                success: false
            },
            { status: error.statusCode }
        )
    }

    if (error instanceof Error) {
        // Handle Prisma errors
        if (error.message.includes('Unique constraint')) {
            return NextResponse.json(
                {
                    error: 'A record with this information already exists',
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    success: false
                },
                { status: 400 }
            )
        }

        if (error.message.includes('Foreign key constraint')) {
            return NextResponse.json(
                {
                    error: 'Cannot perform this action due to existing relationships',
                    code: 'FOREIGN_KEY_CONSTRAINT',
                    success: false
                },
                { status: 400 }
            )
        }
    }

    return NextResponse.json(
        {
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            success: false
        },
        { status: 500 }
    )
}

export function successResponse(data: any, message?: string) {
    return NextResponse.json({
        success: true,
        data,
        message
    })
}