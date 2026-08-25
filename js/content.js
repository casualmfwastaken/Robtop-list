import { round, score } from './score.js';

const dir = '/data';

export async function fetchList() {
    let listResult;
    try {
        listResult = await fetch(`${dir}/_list.json`);
        if (!listResult.ok) return null;
    } catch {
        return null;
    }

    try {
        const list = await listResult.json();
        if (!Array.isArray(list)) return null;

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/${path}.json`);
                    if (!levelResult.ok) throw new Error();
                    
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records) 
                                ? level.records.sort((a, b) => b.percent - a.percent) 
                                : [],
                        },
                        null,
                    ];
                } catch {
                    return [null, path];
                }
            }),
        );
    } catch {
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        if (!editorsResults.ok) return null;
        return await editorsResults.json();
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];
    
    list.forEach(([level, err], rank) => {
        if (err || !level) {
            if (err) errs.push(err);
            return;
        }

        if (!level.verifier) return;

        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name || 'Unknown',
            score: score(rank + 1, 100, level.percentToQualify || 100),
            link: level.verification || '',
        });

        if (Array.isArray(level.records)) {
            level.records.forEach((record) => {
                if (!record || !record.user) return;

                const user = Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;
                
                scoreMap[user] ??= {
                    verified: [],
                    completed: [],
                    progressed: [],
                };
                const { completed, progressed } = scoreMap[user];
                
                if (record.percent === 100) {
                    completed.push({
                        rank: rank + 1,
                        level: level.name || 'Unknown',
                        score: score(rank + 1, 100, level.percentToQualify || 100),
                        link: record.link || '',
                    });
                    return;
                }

                progressed.push({
                    rank: rank + 1,
                    level: level.name || 'Unknown',
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify || 100),
                    link: record.link || '',
                });
            });
        }
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + (cur?.score || 0), 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
