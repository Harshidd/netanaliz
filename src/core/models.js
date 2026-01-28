/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 * @property {number} [siraNo]
 * @property {string|number} [studentNumber]
 * @property {string|number} [no]
 */

/**
 * @typedef {Object} Config
 * @property {string} [city]
 * @property {string} [district]
 * @property {string} [schoolName]
 * @property {string} [principalName]
 * @property {string} [courseName]
 * @property {string} [teacherName]
 * @property {string} [gradeLevel]
 * @property {string} [classSection]
 * @property {string} [examName]
 * @property {string} [examDate]
 * @property {number} [generalPassingScore]
 * @property {number} [outcomeMasteryThreshold]
 * @property {number} [successThreshold]
 * @property {number} [outcomeCount]
 * @property {string[]} [outcomes]
 * @property {number[]} [outcomeScores]
 */

/**
 * @typedef {Object.<string, Object.<string, number|string>>} Grades
 */

/**
 * @typedef {Object} StudentResult
 * @property {string} id
 * @property {string} name
 * @property {number} total
 * @property {number[]} outcomeScores
 * @property {boolean} isPassing
 * @property {number} percentage
 * @property {string} [studentNumber]
 * @property {string} [no]
 * @property {number} [siraNo]
 */

export {}
