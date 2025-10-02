import prisma from './prisma'
import { NotificationType } from '@/generated/prisma'

interface NotificationData {
    title: string
    message: string
    type: NotificationType
    broadcast?: boolean
    studentId?: string
    teacherId?: string
    parentId?: string
    adminId?: string
}

export async function createNotification(data: NotificationData) {
    try {
        return await prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type,
                broadcast: data.broadcast || false,
                studentId: data.studentId,
                teacherId: data.teacherId,
                parentId: data.parentId,
                adminId: data.adminId
            }
        })
    } catch (error) {
        console.error('Failed to create notification:', error)
        throw new Error('Failed to create notification')
    }
}

export async function notifyParentsOfStudent(studentId: string, notification: Omit<NotificationData, 'parentId'>) {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { parent: true }
        })

        if (student?.parent) {
            await createNotification({
                ...notification,
                parentId: student.parent.id
            })
        }
    } catch (error) {
        console.error('Failed to notify parent:', error)
    }
}

export async function notifyStudentsInClass(classId: string, notification: Omit<NotificationData, 'studentId'>) {
    try {
        const students = await prisma.student.findMany({
            where: { classid: classId }
        })

        const notificationPromises = students.map(student =>
            createNotification({
                ...notification,
                studentId: student.id
            })
        )

        await Promise.all(notificationPromises)
    } catch (error) {
        console.error('Failed to notify students in class:', error)
    }
}

export async function broadcastToRole(role: string, notification: NotificationData) {
    try {
        let users: any[] = []

        switch (role) {
            case 'Admin':
            case 'Super':
            case 'Management':
                users = await prisma.administration.findMany()
                break
            case 'Teacher':
                users = await prisma.teacher.findMany()
                break
            case 'Student':
                users = await prisma.student.findMany()
                break
            case 'Parent':
                users = await prisma.parent.findMany()
                break
        }

        const notificationPromises = users.map(user => {
            const notificationData: NotificationData = { ...notification }

            switch (role) {
                case 'Admin':
                case 'Super':
                case 'Management':
                    notificationData.adminId = user.id
                    break
                case 'Teacher':
                    notificationData.teacherId = user.id
                    break
                case 'Student':
                    notificationData.studentId = user.id
                    break
                case 'Parent':
                    notificationData.parentId = user.id
                    break
            }

            return createNotification(notificationData)
        })

        await Promise.all(notificationPromises)
    } catch (error) {
        console.error('Failed to broadcast notification:', error)
    }
}