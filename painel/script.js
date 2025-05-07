const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')
if (token) {
    localStorage.setItem('token', token)
    urlParams.delete('token')
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
}

function query(selector) { return document.querySelector(selector) }

async function wait(ms) {
    return new Promise(result => {
        setTimeout(result, ms)
    })
}

function gerarPagamento(base64qrcode, copia_cola) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ease-out opacity-0'
    modal.innerHTML = `
      <div class="bg-codex-primary rounded-2xl p-8 w-80 sm:w-96 max-w-full transform transition-all duration-300 ease-out scale-95 opacity-0">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-white">Pagamento PIX</h3>
          <button id="fechar-pagamento" class="p-2 rounded-lg hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex flex-col items-center gap-6">
          <div class="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-lg overflow-hidden p-2">
            <img src="data:image/png;base64,${base64qrcode}" alt="QR Code" class="w-full h-full object-contain"/>
          </div>
          <input id="pix-copia" type="text" readonly
            value="${copia_cola}"
            class="w-full bg-codex-dark text-sm p-3 rounded-lg text-white select-all focus:outline-none"/>
          <button id="botao-copiar" class="w-full py-3 rounded-lg bg-codex-accent hover:bg-codex-accent/80 transition text-white font-semibold">
            Copiar código PIX
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const dialog = modal.firstElementChild
    setTimeout(() => {
        modal.classList.remove('opacity-0')
        dialog.classList.remove('scale-95', 'opacity-0')
        dialog.classList.add('scale-100', 'opacity-100')
    }, 10)

    document.getElementById('fechar-pagamento').addEventListener('click', () => {
        modal.classList.add('opacity-0')
        dialog.classList.add('scale-95', 'opacity-0')
        setTimeout(() => modal.remove(), 300)
    })

    document.getElementById('botao-copiar').addEventListener('click', () => {
        navigator.clipboard.writeText(copia_cola).then(() => {
            const toast = document.createElement('div')
            toast.textContent = 'Código copiado!'
            toast.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity duration-300'
            document.body.appendChild(toast)
            setTimeout(() => toast.classList.remove('opacity-0'), 10)
            setTimeout(() => {
                toast.classList.add('opacity-0')
                toast.addEventListener('transitionend', () => toast.remove(), { once: true })
            }, 2000)
        })
    })
}


function gerarSelecaoPeriodo(precoUnitario, tipo, onConfirm) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ease-out opacity-0'
    modal.innerHTML = `
      <div class="bg-codex-primary rounded-2xl p-8 w-96 max-w-full transform transition-all duration-300 ease-out scale-95 opacity-0">
        <h3 class="text-2xl font-bold text-white border-b border-codex-accent/30 pb-4 mb-6">Selecione ${tipo}</h3>
        <p class="text-gray-300">Valor unitário: <span class="text-white font-semibold">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoUnitario)}</span></p>
        <div class="grid grid-cols-1 gap-3 mt-6"></div>
        <div class="mt-6 text-right">
          <span class="text-gray-300">Total: </span><span id="total-valor" class="text-white font-semibold"></span>
        </div>
        <div class="mt-8 flex justify-end space-x-4">
          <button id="cancel-btn" class="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition text-white">Cancelar</button>
          <button id="confirm-btn" class="px-5 py-2 rounded-lg bg-codex-accent hover:bg-codex-accent/80 transition text-white">Confirmar</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    const dialog = modal.firstElementChild
    const container = dialog.querySelector('div.grid')
    const totalDisplay = dialog.querySelector('#total-valor')
    const cancelBtn = dialog.querySelector('#cancel-btn')
    const confirmBtn = dialog.querySelector('#confirm-btn')

    const config = {
        Semanal: { sing: 'semana', plur: 'semanas', multiplier: 1 },
        Mensal: { sing: 'mês', plur: 'meses', multiplier: 1 },
        Trimensal: { sing: 'mês', plur: 'meses', multiplier: 3 }
    }
    const { sing, plur, multiplier } = config[tipo] || { sing: '', plur: '', multiplier: 1 }
    const options = [1, 2, 3]

    options.forEach(count => {
        const units = count * multiplier
        const label = document.createElement('label')
        label.className = 'flex items-center p-3 border border-gray-700 rounded-lg cursor-pointer transition'
        label.innerHTML = `
        <input type="radio" name="period" value="${count}" class="sr-only"/>
        <span class="text-white">${units} ${units > 1 ? plur : sing}</span>
      `
        container.appendChild(label)
    })

    function atualizar() {
        const checked = dialog.querySelector('input[name="period"]:checked')
        const count = Number(checked?.value || 1)
        let total = precoUnitario * count
        if (count > 1) total *= 0.9
        totalDisplay.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
        dialog.querySelectorAll('label').forEach(label => {
            const input = label.querySelector('input')
            if (input.checked) {
                label.classList.add('border-codex-accent', 'bg-codex-accent/10')
            } else {
                label.classList.remove('border-codex-accent', 'bg-codex-accent/10')
            }
        })
    }

    dialog.querySelectorAll('label').forEach(label => {
        label.addEventListener('click', () => {
            label.querySelector('input').checked = true
            atualizar()
        })
    })

    setTimeout(() => {
        modal.classList.remove('opacity-0')
        dialog.classList.remove('scale-95', 'opacity-0')
        dialog.classList.add('scale-100', 'opacity-100')
    }, 10)

    atualizar()
    cancelBtn.addEventListener('click', () => modal.remove())
    confirmBtn.addEventListener('click', () => {
        const count = Number(dialog.querySelector('input[name="period"]:checked')?.value || 1)
        let total = precoUnitario * count
        if (count > 1) total *= 0.9
        modal.style.transition = '500ms ease-in'
        setTimeout(() => {
            modal.style.opacity = '0'
            setTimeout(() => {
                modal.remove()
            }, 500)
        }, 1)
        onConfirm(count, total)
    })
}

function createApplicationElement() {
    const el = document.createElement('div')
    el.className = "aplicacao p-4 bg-[rgb(18,26,33)] rounded-lg shadow relative cursor-pointer border border-[rgb(30,30,30)] hover:border-[rgb(100,100,100)]";
    el.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <div class="flex align-center">
                    <img src="https://cdn.discordapp.com/emojis/1366577891189588078.gif?size=128" class="rounded-full w-9 h-9 user_img">
                    <div class="nome_aplicacao ml-2 font-semibold text-lg mb-1 h-5 skeleton-shimmer rounded truncate" style="width: 15rem"></div>
                </div>
                <div class="descricao_aplicacao text-sm text-gray-400 mb-3 h-4 w-80 skeleton-shimmer rounded truncate"></div>
            </div>
            <div class="relative" style="position:relative">
                <button class="menu-btn p-1 rounded hover:bg-gray-700 absolute right-2 top-2">
                    <i data-feather="more-vertical" class="w-5 h-5" style="color: rgb(150,150,150)"></i>
                </button>
                <div class="menu-options absolute right-8 top-8 w-40 bg-codex-primary border border-gray-600 rounded-md shadow-lg hidden flex-col transition-opacity duration-300 opacity-0 z-10"></div>
            </div>
        </div>
        <div class="flex items-center gap-2 mb-3">
            <span class="status-dot inline-block w-3 h-3 rounded-full bg-gray-500 transition-colors duration-500"></span>
            <span class="status-text text-sm">Offline</span>
        </div>
        <div class="mb-2 text-sm text-gray-300"><span class="mem-text">0 / 0 MB</span></div>
        <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-4">
            <div class="mem-bar bg-codex-accent h-2 w-0 transition-all duration-500"></div>
        </div>
        <div class="flex items-center text-sm text-gray-300 mb-1">
            <i data-feather="cpu" class="inline-block w-4 h-4 mr-1" style="color: rgb(150,150,150)"></i>
            <span class="cpu-text">0%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div class="cpu-bar bg-codex-accent h-2 w-0 transition-all duration-500"></div>
        </div>`
    el.style.opacity = '0'
    el.style.transition = '400ms ease-in-out'

    document.querySelector(".aplicacoes").appendChild(el)
    feather.replace()

    setTimeout(() => {
        el.style.opacity = '1'
        setTimeout(() => {
            el.classList.add('animate-pulse')
        }, 300)
    }, 1)

    return el
}


for (var i = 0; i <= 8; i++) {
    createApplicationElement()
}
async function index() {
    async function fetchPost(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).catch(() => ({ success: false }))
        return await response.json()
    }
    async function fetchGet(url) {
        const response = await fetch(url)
        return await response.json()
    }
    const isLogged = await fetchGet('https://codexapps.squareweb.app/api/check/token?token=' + (localStorage.getItem('token') || ''))
    if (!isLogged?.success) {
        console.log(isLogged)
        window.location.href = 'login'
        return
    }
    const email = String(isLogged.response.email)
    const user = String(isLogged.response.username)
    const icon = isLogged.response.iconURL
    const container = query('.user_logged')
    const elImage = query('.user_image')
    const elName = query('.user_name')
    const elEmail = query('.user_email');


    [elImage, elName, elEmail].forEach(el => el.classList.remove('skeleton-shimmer', 'animate-pulse', 'bg-codex-primary'))
    container.querySelector('div').classList.remove('animate-pulse')
    elImage.innerHTML = `<img src="${icon}" class="w-full h-full rounded-full">`
    elName.textContent = user
    const prefix = email.includes('@') ? email.split('@')[0] : email
    elEmail.textContent = '•'.repeat(prefix.length) + (email.includes('@') ? '@gmail.com' : '')

    const aplicacoesCriadas = 4 * 2
    const aplicacoesTenho = isLogged.response.mensalidades_ids.length

    if (aplicacoesCriadas > aplicacoesTenho) {
        const apagar = aplicacoesCriadas - aplicacoesTenho

        console.log(`Tem ${aplicacoesCriadas} aplicacoes criadas, e tenho ${aplicacoesTenho}, irei apagar ${apagar}`)

        for (var i = 0; i < apagar; i++) {
            document.querySelector(".aplicacoes").removeChild(document.querySelector(".aplicacao"))

        }
    } else if (aplicacoesCriadas < aplicacoesTenho) {
        const faltamCriar = aplicacoesTenho - aplicacoesCriadas

        for (var i = 0; i < faltamCriar; i++) {
            createApplicationElement()
        }
    } else if (aplicacoesTenho == 0) {
        for (var i = 0; i < 4 * 2; i++) {
            document.querySelector(".aplicacoes").removeChild(document.querySelector(".aplicacoes").lastChild)
        }
    }

    const aplicacoes = document.querySelectorAll('.aplicacao')


    for (var i = 0; i < aplicacoes.length - 1; i++) {
        const id = isLogged.response.mensalidades_ids[i][1]
        aplicacoes[i].setAttribute('alt', id)
    }

    for (v of document.querySelectorAll('.aplicacao')) {
        if (v.getAttribute('alt') == null) {
            document.querySelector(".aplicacoes").removeChild(v)
        }
    }

    const Socket = new WebSocket(`wss://codexapps.squareweb.app/api/applications`)

    Socket.onopen = () => {
        console.log('Conectado ao servidor!')
        Socket.send(JSON.stringify({
            event: 'auth',
            token: localStorage.getItem('token')
        }))
    }
    let AplicacoesInfos = {}
    Socket.onmessage = async (msg) => {
        try {
            const data = JSON.parse(msg.data)
            if (data?.event == 'auth') {
                if (data?.response == false) {
                    window.location.href = 'login'
                    return
                }

                for (v of data.response.valores_mensalidades) {
                    AplicacoesInfos[v[1]] = {
                        applicationId: v[1],
                        nome: v[2],
                        descricao: v[3],
                        valor: v[4],
                        expira: v[5],
                        mensalidade_id: v[0],
                        tipo: v[6]
                    }
                }
            }
            if (data?.event == 'profile') {
                for (v of document.querySelectorAll('.aplicacao')) {
                    if (v.getAttribute('alt') == data.applicationId) {
                        v.querySelector(".user_img").src = data.avatar
                    }
                }
            }
            if (data?.event == 'status') {
                for (const v of data.response) {
                    for (card of document.querySelectorAll('.aplicacao')) {
                        if (card.getAttribute('alt') == v.applicationId) {
                            if (v.online == true && (v?.ram && v?.ramMax) || v.online == false) {
                                atualizarCard(
                                    card,
                                    {
                                        nome: AplicacoesInfos[v.applicationId]?.nome + ` (id:${AplicacoesInfos[v.applicationId]?.mensalidade_id})`,
                                        descricao: AplicacoesInfos[v.applicationId]?.descricao,
                                        memoriaMaxima: v?.ramMax || 0,
                                        memoriaUsada: v?.ram || 0,
                                        cpu: v?.cpu || 0,
                                        online: v?.online,
                                        expira: AplicacoesInfos[v.applicationId]?.expira,
                                        menuOptions: [
                                            {
                                                label: v?.online ? 'Desligar' : 'Ligar', onClick: () => {
                                                    Socket.send(JSON.stringify({
                                                        event: v?.online ? `stop` : `start`,
                                                        applicationId: v.applicationId
                                                    }))
                                                    Notificar(`Aplicação ${v?.online ? 'Desligada' : 'Ligada'}!`, 1)
                                                }
                                            },
                                            {
                                                label: 'Renovar', onClick: () => {

                                                    gerarSelecaoPeriodo(AplicacoesInfos[v.applicationId].valor, AplicacoesInfos[v.applicationId].tipo, async (vezes, total) => {

                                                        const resp = await fetchGet(`https://codexapps.squareweb.app/api/renovar?token=${localStorage.getItem('token')}&serverId=${v.applicationId}&vezes=${vezes}`)

                                                        if (resp.success) {
                                                            gerarPagamento(resp.response.base_64, resp.response.copia_cola)
                                                        } else {
                                                            Notificar(resp.message, 3)
                                                        }
                                                    })
                                                }
                                            },
                                        ]
                                    }
                                )

                                const urlParams = new URLSearchParams(window.location.search)
                                const renovar = urlParams.get('renovar')
                                if (renovar) {
                                    if (renovar == v.applicationId) {
                                        urlParams.delete('renovar')
                                        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
                                        gerarSelecaoPeriodo(AplicacoesInfos[v.applicationId].valor, AplicacoesInfos[v.applicationId].tipo, async (vezes, total) => {

                                            const resp = await fetchGet(`https://codexapps.squareweb.app/api/renovar?token=${localStorage.getItem('token')}&serverId=${v.applicationId}&vezes=${vezes}`)

                                            if (resp.success) {
                                                gerarPagamento(resp.response.base_64, resp.response.copia_cola)
                                            } else {
                                                Notificar(resp.message, 3)
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch {

        }
    }

    if (isLogged.response.mensalidades_ids.length == 0) {
        return
    }

    while (Object.values(AplicacoesInfos).length == 0) {
        await wait(50)
    }
}
index()

function formatTimeRemaining(expireDate) {
    const now = new Date();
    let delta = Math.floor((new Date(expireDate) - now) / 1000);
    if (delta <= 0) return 'expirou';

    const parts = [];

    const months = Math.floor(delta / (30 * 24 * 3600));
    if (months) parts.push(months + (months > 1 ? ' meses' : ' mês'));
    delta -= months * 30 * 24 * 3600;

    const days = Math.floor(delta / (24 * 3600));
    if (days) parts.push(days + (days > 1 ? ' dias' : ' dia'));
    delta -= days * 24 * 3600;

    const hours = Math.floor(delta / 3600);
    if (hours) parts.push(hours + (hours > 1 ? ' horas' : ' hora'));
    delta -= hours * 3600;

    const minutes = Math.floor(delta / 60);
    if (minutes) parts.push(minutes + (minutes > 1 ? ' minutos' : ' minuto'));
    delta -= minutes * 60;

    const seconds = delta;
    if (seconds) parts.push(seconds + (seconds > 1 ? ' segundos' : ' segundo'));

    return parts.join(', ');
}

function atualizarCard(card, { nome, descricao, memoriaUsada, memoriaMaxima, cpu, online, menuOptions, expira }) {
    if (online == false) {
        cpu = 0
        memoriaUsada = 0
    }
    card.classList.remove('animate-pulse')
    card.querySelectorAll('.skeleton-shimmer').forEach(el => el.classList.remove('skeleton-shimmer'))
    card.querySelector('.nome_aplicacao').textContent = nome
    card.querySelector('.descricao_aplicacao').textContent = descricao
    const dot = card.querySelector('.status-dot')
    const text = card.querySelector('.status-text')
    if (online) {
        dot.classList.add('bg-green-500')
        dot.classList.remove('bg-red-500')
        text.textContent = 'Online'
    } else {
        dot.classList.add('bg-red-500')
        dot.classList.remove('bg-green-500')
        text.textContent = 'Offline'
    }
    const expiraTime = new Date(expira)
    text.textContent += ` (Expira em ${formatTimeRemaining(expiraTime)})`
    const percMem = memoriaMaxima ? (memoriaUsada / memoriaMaxima) * 100 : 0
    card.querySelector('.mem-text').textContent = `${memoriaUsada} / ${memoriaMaxima} MB`
    card.querySelector('.mem-bar').style.width = percMem + '%'
    card.querySelector('.cpu-text').textContent = `${cpu}%`
    card.querySelector('.cpu-bar').style.width = cpu + '%'
    const menu = card.querySelector('.menu-options')
    menu.innerHTML = ''
    menuOptions.forEach(opt => {
        const a = document.createElement('a')
        a.textContent = opt.label
        a.href = '#'
        a.className = 'px-4 py-2 text-sm hover:text-[rgb(150,150,150)] transition'

        a.addEventListener('click', opt.onClick)
        menu.appendChild(a)
    })
}

document.addEventListener('click', e => {
    const btn = e.target.closest('.menu-btn')
    if (btn) {
        const menu = btn.nextElementSibling
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden')
            setTimeout(() => menu.classList.remove('opacity-0'), 10)
        } else {
            menu.classList.add('opacity-0')
            menu.addEventListener('transitionend', () => menu.classList.add('hidden'), { once: true })
        }
    } else {
        document.querySelectorAll('.menu-options').forEach(menu => {
            if (!menu.classList.contains('hidden')) {
                menu.classList.add('opacity-0')
                menu.addEventListener('transitionend', () => menu.classList.add('hidden'), { once: true })
            }
        })
    }
})

function Notificar(message, type = 1) {
    const notifications = document.getElementById('notifications')
    const notification = document.createElement('div')
    notification.className = `max-w-sm w-full p-4 rounded-lg shadow-xl flex items-center gap-3
        ${type === 1 ? 'bg-green-600' : ''}${type === 2 ? 'bg-yellow-400 text-black' : ''}${type === 3 ? 'bg-red-600' : ''}${type === 4 ? 'bg-codex-primary' : ''}
        animate-fade-in-up`
    notification.innerHTML = `<div class="flex-1 text-white font-medium">${message}</div>`
    notifications.appendChild(notification)
    setTimeout(() => { notification.classList.add('opacity-0'); setTimeout(() => notification.remove(), 500) }, 3000)
}
