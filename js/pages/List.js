import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="list-tabs" style="display: flex; width: 100%; background: var(--color-background-hover); border-radius: 4px; padding: 4px; margin-bottom: 15px; box-sizing: border-box;">
                    <button @click="currentTab = 'ranked'; selectedIndex = 0;" 
                            :style="{ flex: 1, padding: '8px', border: 'none', background: currentTab === 'ranked' ? 'var(--color-primary)' : 'transparent', color: currentTab === 'ranked' ? 'var(--color-on-primary)' : 'var(--color-on-background)', cursor: 'pointer', borderRadius: '4px', fontWeight: '600' }">
                        <span class="type-label-lg">Ranked</span>
                    </button>
                    <button @click="currentTab = 'unverified'; selectedIndex = 0;" 
                            :style="{ flex: 1, padding: '8px', border: 'none', background: currentTab === 'unverified' ? 'var(--color-primary)' : 'transparent', color: currentTab === 'unverified' ? 'var(--color-on-primary)' : 'var(--color-on-background)', cursor: 'pointer', borderRadius: '4px', fontWeight: '600' }">
                        <span class="type-label-lg">Unverified</span>
                    </button>
                </div>

                <table class="list" v-if="currentTab === 'ranked'">
                    <template v-for="(level, i) in rankedList">
                        <tr v-if="i === 0">
                            <td colspan="2" style="text-align: center; padding: 20px 0 10px 0; color: var(--color-on-background); opacity: 1;">
                                <span class="type-label-lg" style="font-weight: 500;">Main List</span>
                            </td>
                        </tr>
                        <tr v-if="i === 10">
                            <td colspan="2" style="text-align: center; padding: 30px 0 10px 0; color: var(--color-on-background); opacity: 1;">
                                <span class="type-label-lg" style="font-weight: 500;">Extended List</span>
                            </td>
                        </tr>
                        <tr v-if="i === 20">
                            <td colspan="2" style="text-align: center; padding: 30px 0 10px 0; color: var(--color-on-background); opacity: 1;">
                                <span class="type-label-lg" style="font-weight: 500;">Legacy List</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="rank">
                                <p v-if="i + 1 <= 20" class="type-label-lg">#{{ i + 1 }}</p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selectedIndex == i, 'error': !level }">
                                <button @click="selectedIndex = i">
                                    <span class="type-label-lg">{{ level?.name || 'Error Loading' }}</span>
                                </button>
                            </td>
                        </tr>
                    </template>
                </table>

                <table class="list" v-if="currentTab === 'unverified'">
                    <tr v-if="unverifiedList.length === 0">
                        <td style="text-align: center; padding: 20px; opacity: 0.5;">
                            <span class="type-label-lg">No unverified levels.</span>
                        </td>
                    </tr>
                    <template v-else v-for="(level, i) in unverifiedList">
                        <tr>
                            <td class="rank">
                                <p class="type-label-lg">—</p>
                            </td>
                            <td class="level" :class="{ 'active': selectedIndex == i, 'error': !level }">
                                <button @click="selectedIndex = i">
                                    <span class="type-label-lg">{{ level?.name || 'Error Loading' }}</span>
                                </button>
                            </td>
                        </tr>
                    </template>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author || ''" :creators="level.creators || []" :verifier="level.verifier || ''"></LevelAuthors>
                    <iframe v-if="video" class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(currentTab === 'ranked' ? selectedIndex + 1 : 100, 100, level.percentToQualify || 100) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="currentTab === 'unverified'">This level is currently unverified.</p>
                    <p v-else-if="selectedIndex + 1 <= 10"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selectedIndex + 1 <= 20"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    
                    <table class="records" v-if="level.records && level.records.length > 0">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                    <p v-else style="opacity: 0.6; padding: 10px 0;">No records established yet.</p>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks (such as Speedhacking, Macroing, etc.)
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site.
                    </p>
                    <p>
                        Have click sounds in the completion video, clickbots are only allowed for Extended List levels. Otherwise just show taps.
                    </p>
                    <p>
                        The completion must show the death animation
                    </p>
                    <p>
                        The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        Do not use secret ways
                    </p>
                    <p>
                        Do not use easy, hold, noclip and/or auto versions of levels listed. We will reject them. LDM/ULDM versions are fine though.
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, you have 24 hours to beat it, then we will NEVER accept records for that level again.
                    </p>
                    <p>
                        #0-10: Main list, will accept all records (list percentage and up)
                    </p>
                    <p>
                        #10-20: Extended list, will accept only 100% records
                    </p>
                    <p>
                        #20-30: Legacy list, will only accept records within 24 hours of falling
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selectedIndex: 0,
        currentTab: 'ranked',
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        rankedList() {
            return this.list ? this.list.filter(([lvl]) => lvl && lvl.verifier).map(([lvl]) => lvl) : [];
        },
        unverifiedList() {
            return this.list ? this.list.filter(([lvl]) => lvl && !lvl.verifier).map(([lvl]) => lvl) : [];
        },
        level() {
            const activeList = this.currentTab === 'ranked' ? this.rankedList : this.unverifiedList;
            return activeList && activeList[this.selectedIndex] ? activeList[this.selectedIndex] : null;
        },
        video() {
            if (!this.level || (!this.level.verification && !this.level.showcase)) {
                return null;
            }

            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        const fetched = await fetchList();
        this.editors = await fetchEditors();

        if (!fetched) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.list = fetched;
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Failed to load level. (${err}.json)`)
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
