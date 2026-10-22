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
                <table class="list" v-if="list">
                    <template v-for="([level, err], i) in list">
                        <tr v-if="i === 0">
                            <td colspan="2" style="text-align: center; padding: 20px 0 10px 0; font-family: system-ui, -apple-system, sans-serif; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: normal; color: #000000; opacity: 1;">
                                <span>Main List</span>
                            </td>
                        </tr>
                        <tr v-if="i === 10">
                            <td colspan="2" style="text-align: center; padding: 30px 0 10px 0; font-family: system-ui, -apple-system, sans-serif; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: normal; color: #000000; opacity: 1;">
                                <span>Extended List</span>
                            </td>
                        </tr>
                        <tr v-if="i === 20">
                            <td colspan="2" style="text-align: center; padding: 30px 0 10px 0; font-family: system-ui, -apple-system, sans-serif; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: normal; color: #000000; opacity: 1;">
                                <span>Legacy List</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="rank">
                                <p v-if="i + 1 <= 20" class="type-label-lg">#{{ i + 1 }}</p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                </button>
                            </td>
                        </tr>
                    </template>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe v-if="video" class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
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
                    <p v-if="selected + 1 <= 10"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= 20"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
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
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list && this.list[this.selected] ? this.list[this.selected][0] : null;
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
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
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
