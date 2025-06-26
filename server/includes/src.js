module.exports = {


    includes: {


        'bootstrap': {
            css: [
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                '<link rel="preconnect" href="https://fonts.googleapis.com">',
                '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
                '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap" rel="stylesheet">',
                '<link rel="stylesheet" href="/styles/bootstrap.css" />',
            ],
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.min.js" integrity="sha512-ykZ1QQr0Jy/4ZkvKuqWn4iF3lqPZyij9iRv6sGqLRdTPkY69YX6+7wvVGmsdBbiIfN/8OdsI7HABjvEok6ZopQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'bulma': {
            css: [
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/1.0.1/css/bulma.min.css" integrity="sha512-dF4b2QV/0kq+qlwefqCyb+edbWZ63ihXhE4A2Pju3u4QyaeFzMChqincJsKYwghbclpLE92jPb9yaz/LQ8aNlg==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                // '<link rel="stylesheet" href="/styles/bulma.css" />',
                '<link rel="stylesheet" href="/styles/bulma.loader.css" />',
            ],
        },

        'bulma.badge': {
            css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma-badge@3.0.1/dist/css/bulma-badge.min.css" integrity="sha256-CN+LF+TWRodDpuBe1qXDnv4aL3DblLeZL2hZNlGjaZE=" crossorigin="anonymous">',
        },

        'bulma.checkradio': {
            css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma-checkradio@2.1.3/dist/css/bulma-checkradio.min.css" integrity="sha256-G/YP5Z6OUqEl4HHU1tJE4JOe+mnfkdazpXAEG62+ZU8=" crossorigin="anonymous">',
        },

        'bulma.modal': {
            js: '<script src="/scripts/bulma.modal.js"></script>',
        },

        'bulma.steps': {
            css: [
                '<link rel="stylesheet" href="https://cdn.rawgit.com/octoshrimpy/bulma-o-steps/master/bulma-steps.css" />',
                '<link rel="stylesheet" href="/styles/bulma.steps.css" />',
                // '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma-steps@2.2.1/dist/css/bulma-steps.min.css" integrity="sha256-2VMsFL68nak478Q553stUdMbocucF0+fqbGQeAc3KCU=" crossorigin="anonymous">',
            ],
            // js: '<script src="https://cdn.jsdelivr.net/npm/bulma-steps@2.2.1/dist/js/bulma-steps.min.js" integrity="sha256-RguSWIp8xU7Pb8DOP9LlaypP8KkExzz6VuG0wtkNig0=" crossorigin="anonymous"></script>',
        },

        'bulma.switch': {
            css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma-switch@2.0.4/dist/css/bulma-switch.min.css" integrity="sha256-8EYN3r3ZVCWlBZCQhQOhcPX/CLKL1TVzxxeR/HzR5vU=" crossorigin="anonymous">',
        },


        'datatables': {
            css: [
                '<link rel="stylesheet" href="https://cdn.datatables.net/2.1.3/css/dataTables.dataTables.min.css" />',
                '<link rel="stylesheet" href="https://cdn.datatables.net/fixedheader/4.0.1/css/fixedHeader.dataTables.min.css" />',
                '<link rel="stylesheet" href="/styles/datatables.css" />',
            ],
            js: [
                '<script src="https://cdn.datatables.net/2.1.3/js/dataTables.min.js"></script>',
                '<script src="https://cdn.datatables.net/fixedheader/4.0.1/js/dataTables.fixedHeader.min.js"></script>',
                '<script src="/scripts/datatables.js"></script>',
                '<script src="/scripts/datatables.defaults.js"></script>',
            ],
        },

        'datatables.bulma': {
            css: [
                '<link rel="stylesheet" href="https://cdn.datatables.net/2.1.3/css/dataTables.bulma.min.css" />',
                '<link rel="stylesheet" href="/styles/datatables.css" />',
            ],
            js: [
                '<script src="https://cdn.datatables.net/2.1.3/js/dataTables.min.js"></script>',
                '<script src="https://cdn.datatables.net/2.1.3/js/dataTables.bulma.min.js"></script>',
                '<script src="https://cdn.datatables.net/fixedheader/4.0.1/js/dataTables.fixedHeader.min.js"></script>',
                '<script src="https://cdn.datatables.net/fixedheader/4.0.1/js/fixedHeader.bulma.min.js"></script>',
                '<script src="/scripts/datatables.js"></script>',
                '<script src="/scripts/datatables.defaults.js"></script>',
            ],
        },

        'datatables.bulma.row-group': {
            css: '<link rel="stylesheet" href="https://cdn.datatables.net/rowgroup/1.5.0/css/rowGroup.bulma.css" />',
            js: [
                '<script src="https://cdn.datatables.net/rowgroup/1.5.0/js/dataTables.rowGroup.js"></script>',
                '<script src="https://cdn.datatables.net/rowgroup/1.5.0/js/rowGroup.bulma.js"></script>',
            ],
        },

        'datatables.fomantic-ui': {
            css: [
                '<link rel="stylesheet" href="https://cdn.datatables.net/2.2.2/css/dataTables.semanticui.css" />',
                '<link rel="stylesheet" href="https://cdn.datatables.net/fixedheader/4.0.1/css/fixedHeader.semanticui.css" />',
                '<link rel="stylesheet" href="/styles/datatables.fomantic-ui.css" />',
            ],
            js: [
                '<script src="https://cdn.datatables.net/2.2.2/js/dataTables.min.js"></script>',
                '<script src="https://cdn.datatables.net/2.2.2/js/dataTables.semanticui.min.js"></script>',
                '<script src="https://cdn.datatables.net/fixedheader/4.0.1/js/dataTables.fixedHeader.min.js"></script>',
                '<script src="https://cdn.datatables.net/fixedheader/4.0.1/js/fixedHeader.semanticui.min.js"></script>',
                '<script src="/scripts/datatables.js"></script>',
                '<script src="/scripts/datatables.defaults.js"></script>',
            ],
        },

        'datatables.date-time': {
            js: '<script src="https://cdn.datatables.net/datetime/1.5.3/js/dataTables.dateTime.min.js"></script>',
        },


        'fomantic-ui': {
            css: [
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fomantic-ui/2.9.3/semantic.min.css" integrity="sha512-3quBdRGJyLy79hzhDDcBzANW+mVqPctrGCfIPosHQtMKb3rKsCxfyslzwlz2wj1dT8A7UX+sEvDjaUv+WExQrA==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                // '<link rel="stylesheet" href="/styles/fomantic-ui.css" />',
                '<link rel="stylesheet" href="/styles/fomantic-ui.colors.css" />',
            ],
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/fomantic-ui/2.9.3/semantic.min.js" integrity="sha512-gnoBksrDbaMnlE0rhhkcx3iwzvgBGz6mOEj4/Y5ZY09n55dYddx6+WYc72A55qEesV8VX2iMomteIwobeGK1BQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'font-awesome': {
            css: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js" integrity="sha512-u3fPA7V8qQmhBPNT5quvaXVa1mnnLSXUep5PS1qo5NRzHwG19aHmNJnj1Q8hpA/nBWZtZD4r4AX6YOt5ynLN2g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'imask': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js" integrity="sha512-+3RJc0aLDkj0plGNnrqlTwCCyMmDCV1fSYqXw4m+OczX09Pas5A/U+V3pFwrSyoC1svzDy40Q9RU/85yb/7D2A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'jquery': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },

        'jquery.caret': {
            // js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/caret/1.3.7/jquery.caret.min.js" integrity="sha512-DR6H+EMq4MRv9T/QJGF4zuiGrnzTM2gRVeLb5DOll25f3Nfx3dQp/NlneENuIwRHngZ3eN6w9jqqybT3Lwq+4A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
            js: '<script src="https://cdn.jsdelivr.net/npm/jquery-caret-plugin@1.5.3/dist/jquery.caret.min.js" integrity="sha256-RD1SfEiATSSOzWpoErbnIRl/oW6aY/QuR8YcBACqBU0=" crossorigin="anonymous"></script>',
        },

        'jquery.cookie': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js" integrity="sha512-3j3VU6WC5rPQB4Ld1jnLV7Kd5xr+cq9avvhwqzbH/taCRNURoeEpoPBK9pDyeukwSxwRPJ8fDgvYXd6SkaZ2TA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },

        'jquery.idle-timeout': {
            dependencies: [ 'jquery.ui', 'store-js' ],
            js: '<script src="https://cdn.jsdelivr.net/npm/jquery-idletimeout@1.0.10/jquery-idleTimeout.min.js" integrity="sha256-ZA4GvwzV/dJAFLWsBLRUreqTeRDgIbkBLdZ9LtFTzYE=" crossorigin="anonymous"></script>',
        },

        'jquery.idle-timeout-plus': {
            css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-idleTimeout-plus@0.9.3/dist/css/jquery-idleTimeout-plus.min.css" integrity="sha256-5b2Ez9N3Myn8dSxPdxW2IYnDjTAL2cQOL2u1Vve5R/w=" crossorigin="anonymous">',
            js: '<script src="https://cdn.jsdelivr.net/npm/jquery-idleTimeout-plus@0.9.3/dist/js/jquery-idleTimeout-plus.min.js" integrity="sha256-7VZ4CmJ3saVMpExvftJ3JGpREzN+czg/pooir5/1TNo=" crossorigin="anonymous"></script>',
        },

        'jquery.masked-input': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.maskedinput/1.4.1/jquery.maskedinput.min.js" integrity="sha512-d4KkQohk+HswGs6A1d6Gak6Bb9rMWtxjOa0IiY49Q3TeFd5xAzjWXDCBW9RS7m86FQ4RzM2BdHmdJnnKRYknxw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },

        'jquery.mini-colors': {
            css: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-minicolors/2.3.6/jquery.minicolors.min.css" integrity="sha512-BVeRnUOL0G7d4gXmj+0VxpoiQuEibKQtlkclADKvCdNrESs0LA6+H8s1lU455VqWFtHBfF/pKDGw/CMat2hqOg==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-minicolors/2.3.6/jquery.minicolors.min.js" integrity="sha512-vBqPkpOdZM0O7YezzE8xaoUdyt4Z2d+gLrY0AMvmNPLdLuNzvreTopyuaM9/FiRzHs1bwWzYDJgH6STcuNXpqg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },

        'jquery.nice-scroll': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.nicescroll/3.7.6/jquery.nicescroll.min.js" integrity="sha512-zMfrMAZYAlNClPKjN+JMuslK/B6sPM09BGvrWlW+cymmPmsUT1xJF3P4kxI3lOh9zypakSgWaTpY6vDJY/3Dig==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },

        'jquery.ui': {
            css: [
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.3/themes/base/jquery-ui.min.css" integrity="sha512-8PjjnSP8Bw/WNPxF6wkklW6qlQJdWJc/3w/ZQPvZ/1bjVDkrrSqLe9mfPYrMxtnzsXFPc434+u4FHLnLjXTSsg==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                '<link rel="stylesheet" href="/styles/jquery.ui.css" />',
            ],
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.3/jquery-ui.min.js" integrity="sha512-Ww1y9OuQ2kehgVWSD/3nhgfrb424O3802QYP/A5gPXoM4+rRjiKrjHdGxQKrMGQykmsJ/86oGdHszfcVgUr4hA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'luxon': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/luxon/3.5.0/luxon.min.js" integrity="sha512-SN7iwxiJt9nFKiLayg3NjLItXPwRfBr4SQSIugMeBFrD4lIFJe1Z/exkTZYAg3Ul+AfZEGws2PQ+xSoaWfxRQQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'materialize': {
            css: [
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" integrity="sha512-UJfAaOlIRtdR+0P6C3KUoTDAxVTuy3lnSXLyLKlHYJlcSU8Juge/mjeaxDNMlw9LgeIotgz5FP8eUQPhX1q10A==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />',
            ],
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js" integrity="sha512-NiWqa2rceHnN3Z5j6mSAvbwwg3tiwVNxiAQaaSMSXnRRDh5C2mk/+sKQRw8qjV1vN4nf8iK2a0b048PnHbyx+Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


        'moment': {
            js: [
                '<script src="https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js"></script>',
                '<script src="https://cdn.jsdelivr.net/npm/moment-timezone@0.5.45/moment-timezone.min.js"></script>',
                '<script src="/scripts/moment.js"></script>',
            ],
        },


        'store': {
            js: '<script src="https://cdnjs.cloudflare.com/ajax/libs/store.js/2.0.12/store.modern.min.js" integrity="sha512-LifKk2SCJQ92p7X9KnKf6JgRjpyrZqSMRVk7/WDV++84r5Inybxk+zF8d/TtRjGPkliWVAwP7TiePST6CrZgQQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        },


    },


    css(href) {
        if (href.substr(-4) != '.css' && href.substr(-1) != '^')
            href += '.css'
        return `\n\t<link rel="stylesheet" href="/styles/${href.replace('^', '')}" />`
    },


    js(src) {
        if (src.substr(-3) != '.js') src += '.js'
        let attr = ''
        if (src[0] == '^') {
            attr = ' defer'
            src = src.replace('^', '')
        }

        return `\n\t<script src="/scripts/${src}"${attr}></script>`
    },


    mjs(src) {
        if (src.substr(-4) != '.mjs') src += '.mjs'
        let attr = ''
        if (src[0] == '^') {
            attr = ' defer'
            src = src.replace('^', '')
        }

        return `\n\t<script type="module" src="/modules/${src}"${attr}></script>`
    },


    render(instr = {}) {

        let html = {
            css: '',
            js: '',
            mjs: '',
        }

        if (!instr.external) instr.external = []
        for (let item of instr.external) {
            const set = this.includes[item]
            renderByType('css', set)
            renderByType('js', set)
        }

        if (!instr.internal) instr.internal = {}
        if (!instr.internal.css) instr.internal.css = []
        if (!instr.internal.js) instr.internal.js = []
        if (!instr.internal.mjs) instr.internal.mjs = []
        for (let css of instr.internal.css)
            html.css += this.css(css)
        for (let js of instr.internal.js)
            html.js += this.js(js)
        for (let mjs of instr.internal.mjs)
            html.mjs += this.mjs(mjs)

        function renderByType(type, set) {
            if (set[type])
                switch(typeof set[type]) {
                    case 'string':
                        html[type] += `\n\t${set[type]}`
                        break
                    default:
                        if (Array.isArray(set[type]))
                            for (let chunk of set[type])
                                html[type] += `\n\t${chunk}`
                }
        }

        return html.css + html.js + html.mjs
    }


}