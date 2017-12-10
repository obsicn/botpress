import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, Button, Radio, OverlayTrigger, Tooltip, Panel, Well } from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'

import CreateModal from '../modal'
import {
  fetchContentMessagesRecent,
  fetchContentMessagesCount,
  fetchContentCategories,
  upsertContentMessages
} from '~/actions'

class SelectContent extends Component {
  constructor(props) {
    super(props)

    this.state = { show: false, category: null, searchTerm: '' }

    window.botpress = window.botpress || {}
    window.botpress.pickContent = (options = {}, callback) => {
      this.setState({ show: true, callback })
    }
  }

  componentDidMount() {
    this.props.fetchContentMessagesRecent({})
    this.props.fetchContentMessagesCount()
    this.props.fetchContentCategories()
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  search(event) {
    this.setState({ searchTerm: event.target.value })
    this.props.fetchContentMessagesRecent({ searchTerm: event.target.value })
  }

  handleCreate(formData) {
    this.props
      .upsertContentMessages({ categoryId: this.state.category.id, formData })
      .then(() =>
        Promise.all([
          this.props.fetchContentMessagesRecent({ searchTerm: this.state.searchTerm }),
          this.props.fetchContentMessagesCount()
        ])
      )
      .then(() => this.setState({ category: null }))
  }

  handlePick(item) {
    this.setState({ show: false })
    this.state.callback(item)
  }

  render() {
    const props = this.props
    const noop = () => {}

    const onClose = () => this.setState({ show: false })
    const onSubmit = () => this.setState({ show: false })

    const schema = (this.state.category || {}).schema || { json: {}, ui: {} }

    return (
      <Modal animation={false} show={this.state.show} onHide={onClose} container={document.getElementById('app')}>
        <Modal.Header closeButton>
          <Modal.Title>Pick Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            className="form-control"
            placeholder={`Search all content elements (${this.props.messagesCount})`}
            aria-label="Search content elements"
            onKeyUp={::this.search}
          />
          <hr />
          <div className="list-group">
            {this.props.categories.map(category => (
              <a
                href="#"
                onClick={() => this.setState({ category })}
                className="list-group-item list-group-item-action"
              >
                Create new {category.id} question
              </a>
            ))}
            {this.props.messages.map(message => (
              <a href="#" className="list-group-item list-group-item-action" onClick={() => this.handlePick(message)}>
                {`[Custom][${message.categoryId}] ${message.data && message.data.question}`}
              </a>
            ))}
            <a href="#" className="list-group-item list-group-item-action">
              [Built-in][Text] This is trivial!
            </a>
          </div>
        </Modal.Body>

        <CreateModal
          show={Boolean(this.state.category)}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={() => this.setState({ category: null })}
          handleCreateOrUpdate={::this.handleCreate}
        />
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  messages: state.content.recentMessages,
  messagesCount: state.content.messagesCount,
  categories: state.content.categories
})
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { fetchContentMessagesRecent, fetchContentMessagesCount, fetchContentCategories, upsertContentMessages },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(SelectContent)
