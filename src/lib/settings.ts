export const ITEMS_PER_PAGE = 10;

type RouteAccessMap = {
    [key: string]: string[];
}

export const routeAccessMap: RouteAccessMap = {
    "/super(.*)": ["super"],
    "/chasier(.*)": ["chasier"],
    "/admin(.*)": ["admin"],
    "/student(.*)": ["student"],
    "/teacher(.*)": ["teacher"],
    "/parent(.*)": ["parent"],
    "/teachers": ["super", "chasier", "admin", "teacher"],
    "/students": ["super", "chasier", "admin", "teacher"],
    "/parents": ["super", "chasier", "admin", "teacher"],
    "/subjects": ["super", "chasier", "admin",],
    "/classes": ["super", "chasier", "admin", "teacher"],
    "/exams": ["admin", "teacher", "student", "parent"],
    "/assignments": ["admin", "teacher", "student", "parent"],
    "/results": ["admin", "teacher", "student", "parent"],
    "/attendance": ["admin", "teacher", "student", "parent"],
    "/events": ["admin", "teacher", "student", "parent"],
    "/announcements": ["admin", "teacher", "student", "parent"],
}